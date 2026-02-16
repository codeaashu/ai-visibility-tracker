from sqlmodel import Session


class CrudContext:
    def __init__(self, db: Session):
        self.db = db
