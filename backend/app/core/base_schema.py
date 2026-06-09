from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class Schema(BaseModel):
    """
    Базовый класс для всех Pydantic-схем.
    - alias_generator=to_camel  : full_name → fullName (и для входящих, и для исходящих)
    - populate_by_name=True     : принимает и snake_case, и camelCase
    - from_attributes=True      : позволяет создавать из SQLAlchemy-моделей
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,   # всегда сериализовать через camelCase-алиасы
    )
