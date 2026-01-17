import os
import sys

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config import get_settings

def migrate():
    settings = get_settings()
    # Use synchronous driver
    db_url = settings.database_url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='main_character_id'"
            ))
            
            if result.fetchone():
                print("Column 'main_character_id' already exists.")
            else:
                print("Adding 'main_character_id' column...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN main_character_id VARCHAR DEFAULT 'char_000'"
                ))
                conn.commit()
                print("Migration successful: Added 'main_character_id' to 'users' table.")
                
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
