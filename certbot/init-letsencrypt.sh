#!/bin/bash

# Let's Encrypt 인증서 초기 설정 스크립트

# 도메인과 이메일을 설정하세요
domains=(your-domain.com)
email="your-email@example.com" # 알림을 받을 이메일
staging=1 # 테스트용 (0으로 설정하면 실제 인증서 발급)

if [ -d "./certbot/conf/live/${domains[0]}" ]; then
  read -p "기존 인증서가 존재합니다. 삭제하고 다시 생성하시겠습니까? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### certbot 데이터 삭제 중..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${domains[0]} && \
  rm -Rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -Rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot
echo

echo "### 더미 인증서 생성 중 (Nginx 시작용)..."
path="/etc/letsencrypt/live/${domains[0]}"
mkdir -p "./certbot/conf/live/${domains[0]}"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Nginx 시작 중..."
docker-compose up --force-recreate -d nginx
echo

echo "### 더미 인증서 삭제 중..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${domains[0]} && \
  rm -Rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -Rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot
echo

echo "### Let's Encrypt 인증서 요청 중..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# staging 환경 선택
case "$staging" in
  0) staging_arg="--force-renewal" ;;
  *) staging_arg="--staging" ;;
esac

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive" certbot
echo

echo "### Nginx 재시작 중..."
docker-compose exec nginx nginx -s reload
