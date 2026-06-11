"""
Seed script — 12 demo opportunities (BY / RU / LV).

Run inside the backend container:
  docker-compose exec backend python scripts/seed_opportunities.py

Or directly if venv is active (from backend/ directory):
  python scripts/seed_opportunities.py
"""

import asyncio
from datetime import date
from app.core.database import AsyncSessionLocal
from app.models.opportunity import Opportunity


OPPORTUNITIES = [
    # ── ЛАГЕРЯ (camps) ────────────────────────────────────────────────────────
    {
        "type": "camp",
        "title": "Minsk Open Summer Camp 2026",
        "description": (
            "Развивающий хоккейный лагерь для форвардов и защитников в возрасте 13–16 лет. "
            "Программа включает технику катания, броска и тактику. Присутствуют тренеры МХЛ."
        ),
        "location": "Минск, Дворец Хоккея",
        "country": "Belarus",
        "deadline": date(2026, 7, 15),
        "is_urgent": True,
        "tags": ["бесплатно", "8 мест", "форварды", "защитники", "13-16 лет", "тренеры МХЛ"],
        "url": None,
    },
    {
        "type": "camp",
        "title": "Юность Минск — Открытый день академии",
        "description": (
            "Оценочная сессия от академии Юность Минск. Скаут присутствует лично. "
            "Рекомендуется видеозапись тренировки и рекомендация от тренера."
        ),
        "location": "Минск, Арена Юность",
        "country": "Belarus",
        "deadline": date(2026, 7, 30),
        "is_urgent": True,
        "tags": ["топ академия", "скаут присутствует", "все позиции", "13-16 лет"],
        "url": None,
    },
    {
        "type": "camp",
        "title": "Riga Hockey Elite Camp",
        "description": (
            "Элитный летний лагерь в Риге с тренерами из Экстралиги и шведских клубов. "
            "Программа на 10 дней: интенсив на льду + видеоанализ + физподготовка."
        ),
        "location": "Рига, Arēna Rīga",
        "country": "Latvia",
        "deadline": date(2026, 8, 1),
        "is_urgent": False,
        "tags": ["платный", "Экстралига тренеры", "все позиции", "14-17 лет", "видеоанализ"],
        "url": "https://rigahockeyelite.lv",
    },
    {
        "type": "camp",
        "title": "Dynamo Moscow Skills Camp U15",
        "description": (
            "Официальный скиллс-кэмп ХК Динамо Москва для игроков U15. "
            "Лучших участников приглашают на просмотр в основную академию."
        ),
        "location": "Москва, Мегаспорт",
        "country": "Russia",
        "deadline": date(2026, 8, 10),
        "is_urgent": False,
        "tags": ["КХЛ клуб", "U15", "форварды", "защитники", "отбор в академию"],
        "url": None,
    },

    # ── ПРОСМОТРЫ (tryouts) ───────────────────────────────────────────────────
    {
        "type": "tryout",
        "title": "Динамо Минск U15 — Просмотр",
        "description": (
            "Официальный просмотр в молодёжную команду Динамо Минск U15. "
            "Принимают форвардов и защитников 2011–2012 г.р. Нужна рекомендация от школы."
        ),
        "location": "Минск, Дворец Льда",
        "country": "Belarus",
        "deadline": date(2026, 7, 30),
        "is_urgent": True,
        "tags": ["КХЛ клуб", "высокая конкуренция", "форварды", "защитники", "2011-2012 г.р."],
        "url": None,
    },
    {
        "type": "tryout",
        "title": "Металлург Жлобин U16 — Открытый просмотр",
        "description": (
            "Открытый просмотр ХК Металлург Жлобин для игроков U16. "
            "Принимают форвардов и вратарей 2010–2011 г.р. Командная роль в Экстралиге Б."
        ),
        "location": "Жлобин, Ледовый дворец",
        "country": "Belarus",
        "deadline": date(2026, 8, 10),
        "is_urgent": False,
        "tags": ["Экстралига Б", "форварды", "вратари", "2010-2011 г.р.", "возраст +1"],
        "url": None,
    },
    {
        "type": "tryout",
        "title": "MHL Academy Selection — Беларусь",
        "description": (
            "Скаутский отбор МХЛ среди белорусских игроков. Приглашённые скауты из "
            "Трактора, Авангарда и СКА. Требуется портфолио видео (3–5 фрагментов)."
        ),
        "location": "Минск, Минск-Арена",
        "country": "Belarus",
        "deadline": date(2026, 9, 1),
        "is_urgent": False,
        "tags": ["МХЛ скауты", "все позиции", "14-17 лет", "видеопортфолио", "цель-совместимо"],
        "url": None,
    },
    {
        "type": "tryout",
        "title": "SKA Neva U17 Tryout — Санкт-Петербург",
        "description": (
            "Просмотр в фарм-клуб СКА для перспективных игроков U17. "
            "Льготное участие для иностранных игроков. Предоставляется жильё."
        ),
        "location": "Санкт-Петербург, Ледовый дворец",
        "country": "Russia",
        "deadline": date(2026, 9, 15),
        "is_urgent": False,
        "tags": ["КХЛ фарм", "U17", "все позиции", "жильё предоставляется", "иностранцы welcomed"],
        "url": None,
    },

    # ── ТУРНИРЫ (tournaments) ─────────────────────────────────────────────────
    {
        "type": "tournament",
        "title": "Кубок Беларуси U15 — Осень 2026",
        "description": (
            "Национальный турнир для региональных команд U15. "
            "Проводится в два этапа: групповой (сентябрь) + плей-офф (октябрь). "
            "Скауты МХЛ и национальной сборной наблюдают за игроками."
        ),
        "location": "Брест, Ледовый дворец",
        "country": "Belarus",
        "deadline": date(2026, 8, 20),
        "is_urgent": False,
        "tags": ["национальный", "командная регистрация", "U15", "скауты сборной", "2 этапа"],
        "url": None,
    },
    {
        "type": "tournament",
        "title": "MHL Scouting Cup 2026",
        "description": (
            "Ежегодный скаутский кубок МХЛ — один из главных турниров для выхода на уровень МХЛ. "
            "Участвуют топовые U17 команды России, Беларуси, Казахстана. "
            "Скауты присутствуют от 18 клубов МХЛ."
        ),
        "location": "Москва, ВТБ Ледовый Дворец",
        "country": "Russia",
        "deadline": None,
        "is_urgent": False,
        "tags": ["МХЛ скауты", "цель-совместимо", "U17", "18 клубов МХЛ", "регистрация в ноябре"],
        "url": None,
    },
    {
        "type": "tournament",
        "title": "Baltic Cup U14 — Рига 2026",
        "description": (
            "Международный молодёжный турнир стран Балтики и СНГ. "
            "Сильная конкуренция, отличная возможность получить оценку от европейских скаутов. "
            "Команды из Латвии, Эстонии, Финляндии, Беларуси."
        ),
        "location": "Рига, Zemgale Olympic Centre",
        "country": "Latvia",
        "deadline": date(2026, 10, 1),
        "is_urgent": False,
        "tags": ["международный", "U14", "европейские скауты", "Балтика + СНГ", "командная регистрация"],
        "url": "https://balticcup.lv",
    },
    {
        "type": "tournament",
        "title": "Региональный квалификационный турнир — Витебск",
        "description": (
            "Региональный отборочный турнир Витебской области для команд U13–U15. "
            "Победитель получает путёвку на национальный чемпионат Беларуси среди ДЮСШ."
        ),
        "location": "Витебск, Ледовый Дворец",
        "country": "Belarus",
        "deadline": date(2026, 9, 5),
        "is_urgent": False,
        "tags": ["региональный", "U13-U15", "ДЮСШ", "путёвка на нацчемпионат", "командная регистрация"],
        "url": None,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count_result = await db.execute(select(func.count()).select_from(Opportunity))
        count = count_result.scalar()
        if count and count > 0:
            print(f"⚠️  Таблица уже содержит {count} записей. Пропускаем.")
            return

        for data in OPPORTUNITIES:
            db.add(Opportunity(**data))

        await db.commit()
        print(f"✅ Добавлено {len(OPPORTUNITIES)} возможностей в БД.")


if __name__ == "__main__":
    asyncio.run(seed())
