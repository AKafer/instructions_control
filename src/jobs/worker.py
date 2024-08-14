import os
import time

from peewee import *


from dotenv import load_dotenv

from models import Rules

load_dotenv()

db = PostgresqlDatabase(
    database=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT')
)

print("Connecting to database")
print(
    f"Database: {os.getenv('POSTGRES_DB')}"
    f"User: {os.getenv('POSTGRES_USER')}"
    f"Host: {os.getenv('DB_HOST')}"
    f"Port: {os.getenv('DB_PORT')}"
)


def main():
    while True:
        print("Checking rules")
        db.connect()
        rules = Rules.select()
        for rule in rules:
            print(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")
        time.sleep(5)
        db.close()


if __name__ == '__main__':
    main()
