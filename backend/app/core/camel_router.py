from fastapi import APIRouter


class CamelRouter(APIRouter):
    """
    APIRouter, который автоматически сериализует ответы по camelCase-алиасам.
    Заменяет стандартный APIRouter во всех роутерах приложения.
    """
    def add_api_route(self, path: str, endpoint, *, response_model=None, **kwargs):
        kwargs.setdefault("response_model_by_alias", True)
        super().add_api_route(path, endpoint, response_model=response_model, **kwargs)
