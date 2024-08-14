import argparse
import uvicorn
from fastapi_utils.tasks import repeat_every

from sqlalchemy import select

from app import create_app
from database.models import Rules
from database.orm import Session
from jobs.scheduler import inspect_rules

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--port", default=8500, type=int)
    parser.add_argument("-ll", "--log_level", default="debug")
    args = parser.parse_args()


    app = create_app()


    print('TEST-2')
    # @app.on_event("startup")
    # @repeat_every(seconds=5)  # 1 hour
    # async def remove_expired_tokens_task() -> None:
    #     print("Running cleaner")
    #     await inspect_rules()
        # async with Session() as session:
        #     query = select(Rules)
        #     rules = await session.scalars(query)
        #     print('RULES', rules)
        #     for rule in rules:
        #         print(f"Rule: {rule.id} between {rule.profession_id} - {rule.instruction_id}")

    print('TEST-1')
    uvicorn.run(app, host="0.0.0.0", port=args.port, log_level=args.log_level)