# UpWay — Аудит проекта

> **Дата аудита:** июнь 2026  
> **Версия:** 0.1.0  
> **Продукт:** AI-консультант для родителей хоккеистов

---

## 1. Архитектура системы

```
                         Пользователь (браузер)
                               │
                    ┌──────────▼──────────┐
                    │   React SPA (Vite)   │  :3000
                    │  TypeScript + Tailwind│
                    └──────────┬──────────┘
                               │  HTTP / SSE
                    ┌──────────▼──────────┐
                    │   FastAPI Backend    │  :8000
                    │  Python 3.12 async  │
                    └───┬──────┬──────────┘
                        │      │
          ┌─────────────▼─┐  ┌─▼────────────────┐
          │  PostgreSQL 16 │  │  Redis 7          │
          │  + pgvector    │  │  (очередь/кэш)    │
          └───────────────┘  └──────┬────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Celery Worker     │
                         │   + Celery Beat     │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │  OpenAI GPT-4o             │
                    │  DeepSeek V3 (fallback)    │
                    │  OpenAI Embeddings         │
                    │  LlamaIndex + RAG          │
                    └────────────────────────────┘
```

Все сервисы упакованы в **Docker Compose** и поднимаются одной командой.

---

## 2. Backend (FastAPI) — полный разбор

### 2.1 Точка входа: `backend/app/main.py`

Это корневой файл приложения. Он делает три вещи:
- Инициализирует **Sentry** (мониторинг ошибок) если задан `SENTRY_DSN`
- При старте в режиме `development` автоматически создаёт таблицы в БД
- Подключает CORS (чтобы фронтенд мог делать запросы к API) и все роутеры

Эндпоинт `/health` возвращает `{"status": "ok"}` — используется Docker для проверки что сервис живёт.

### 2.2 Конфигурация: `backend/app/core/config.py`

Все настройки читаются из `.env` файла через Pydantic Settings.  
Ключевые переменные:

| Переменная | Назначение |
|---|---|
| `SECRET_KEY` | Подпись JWT-токенов |
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `REDIS_URL` | Адрес Redis для Celery |
| `OPENAI_API_KEY` | Ключ OpenAI для GPT-4o и эмбеддингов |
| `DEEPSEEK_API_KEY` | Ключ DeepSeek (резерв) |
| `YOS_ACCESS_KEY_ID` | Yandex Object Storage |

### 2.3 База данных: `backend/app/core/database.py`

Используется **async SQLAlchemy** с драйвером `asyncpg` — это значит все запросы к БД не блокируют сервер, он может обслуживать тысячи параллельных запросов. Настроен пул соединений (10 основных + 20 overflow).

### 2.4 Безопасность: `backend/app/core/security.py`

**Пароли** хешируются через bcrypt (необратимый алгоритм, стандарт индустрии).

**JWT-токены** двух типов:
- `access_token` — живёт 60 минут, передаётся в каждом запросе в заголовке `Authorization: Bearer ...`
- `refresh_token` — живёт 30 дней, используется чтобы получить новую пару токенов без повторного ввода пароля

### 2.5 Зависимости (Dependency Injection): `backend/app/api/deps.py`

FastAPI использует паттерн DI — в любой эндпоинт можно "внедрить" зависимость.  
Здесь определены два ключевых типа:
- `CurrentUser` — автоматически достаёт текущего пользователя из JWT и проверяет что он активен
- `DB` — открывает сессию к БД и автоматически делает commit/rollback

Любой роутер пишет просто: `async def endpoint(user: CurrentUser, db: DB)` — и всё работает.

---

### 2.6 Модели базы данных

#### `User` (пользователь-родитель)
```
id           UUID        первичный ключ
email        string      уникальный, индекс
full_name    string
password     string      bcrypt-хеш
plan         string      free | starter | pro
is_active    bool
avatar_url   string?
created_at   timestamp
```

#### `Player` (профиль игрока)
```
id              UUID
user_id         UUID → users.id (CASCADE)
name            string
age             int
height_cm       int
weight_kg       int
position        string    forward | defenseman | goaltender
country         string
city            string?
team            string?
hockey_school   string?
level           string    (уровень лиги)
goals           string[]  (массив целей)
skills          JSONB     {skating, shooting, passing, fitness, sense} 1-10
created_at      timestamp
updated_at      timestamp
```

Навыки хранятся в **JSONB** — гибкий формат, можно добавлять новые поля без миграции схемы.

#### `ChatSession` / `ChatMessage` (история чата)
```
ChatSession:
  id          UUID
  user_id     UUID → users.id
  title       string    (первые 60 символов первого сообщения)

ChatMessage:
  id            UUID
  session_id    UUID → chat_sessions.id
  role          string   user | assistant
  content       text
  context_card  text?    (фрагмент из RAG базы знаний)
```

#### `RoadmapItem` (план развития)
```
id             UUID
player_id      UUID → players.id
phase_number   int       (1, 2, 3)
phase          string    (название фазы)
sort_order     int       (порядок внутри фазы)
title          string
description    text
status         string    todo | active | done
target_date    date?
completed_date date?
tags           string[]
```

#### `CalendarEvent` (календарь)
Хранит турниры, тренировки, сборы — привязаны к игроку.

#### `Opportunity` (возможности)
Лагеря, просмотры, турниры из базы данных — источник для раздела "Возможности".

---

### 2.7 API Роутеры

Все эндпоинты доступны по базовому пути `/api/v1/`.  
В режиме разработки интерактивная документация: **http://localhost:8000/api/docs**

#### `/auth` — Аутентификация
| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация → возвращает access + refresh токены |
| POST | `/auth/login` | Вход → возвращает токены |
| POST | `/auth/refresh` | Обновить токены по refresh_token |
| GET | `/auth/me` | Данные текущего пользователя |
| POST | `/auth/password-reset/request` | Запросить сброс пароля (заглушка) |
| POST | `/auth/password-reset/confirm` | Подтвердить новый пароль (заглушка) |

#### `/players` — Профиль игрока
| Метод | Путь | Описание |
|---|---|---|
| POST | `/players/` | Создать профиль (после онбординга) → запускает генерацию роадмапа |
| GET | `/players/me` | Получить профиль |
| PATCH | `/players/me` | Обновить профиль |
| GET | `/players/me/metrics` | Метрики для дашборда |
| GET | `/players/me/next-step` | Следующий рекомендованный шаг |

#### `/chat` — AI Чат
| Метод | Путь | Описание |
|---|---|---|
| GET | `/chat/sessions` | Список сессий чата |
| POST | `/chat/sessions` | Создать новую сессию |
| GET | `/chat/sessions/{id}/messages` | История сообщений |
| POST | `/chat/sessions/{id}/messages` | Отправить сообщение → AI ответ |
| GET | `/chat/sessions/{id}/stream?content=...` | Стриминг ответа (SSE) |

#### `/roadmap` — План развития
| Метод | Путь | Описание |
|---|---|---|
| GET | `/roadmap/` | Получить все этапы (фильтр по phase) |
| PATCH | `/roadmap/{item_id}` | Обновить статус этапа |

#### `/calendar` — Календарь
События игрока: тренировки, турниры, сборы.

#### `/opportunities` — Возможности
| Метод | Путь | Описание |
|---|---|---|
| GET | `/opportunities/` | Список (фильтры: type, country) |
| GET | `/opportunities/{id}` | Детали |

#### `/subscriptions` — Подписки
| Метод | Путь | Описание |
|---|---|---|
| GET | `/subscriptions/plans` | Тарифные планы |
| GET | `/subscriptions/billing` | Информация об оплате |
| POST | `/subscriptions/upgrade` | Перейти на другой план |

---

### 2.8 AI-сервисы

#### `ChatService` (`backend/app/services/ai/chat_service.py`)

Это ядро продукта. При каждом сообщении пользователя:

1. **Загружает профиль игрока** — имя, возраст, позиция, уровень, цели, навыки
2. **RAG-поиск** — ищет релевантные документы в базе знаний (pgvector)
3. **История чата** — берёт последние 10 сообщений для контекста
4. **Формирует промпт** — системный промпт + профиль + RAG-контекст + история + вопрос пользователя
5. **Вызывает GPT-4o** — получает ответ
6. **Fallback на DeepSeek** — если OpenAI недоступен, автоматически переключается

Системный промпт настраивает модель: она знает о лигах КХЛ, МХЛ, ВХЛ, Экстралига; отвечает на языке пользователя (рус/англ); даёт конкретные практические советы.

Поддерживает **стриминг** через SSE — буквы появляются по мере генерации, как в ChatGPT.

#### `RAGService` (`backend/app/services/ai/rag_service.py`)

RAG (Retrieval Augmented Generation) — механизм базы знаний:
- Документы хранятся в PostgreSQL таблице `rag_embeddings` с векторными индексами (pgvector)
- При вопросе пользователя его текст превращается в вектор (OpenAI Embeddings), ищутся 3 наиболее похожих документа
- Найденные документы добавляются в контекст к GPT-4o

База знаний может содержать: гайды по развитию, требования лиг, планы тренировок, информацию о лагерях.

---

### 2.9 Фоновые задачи (Celery)

`backend/app/tasks/ai_tasks.py`

| Задача | Когда запускается | Что делает |
|---|---|---|
| `generate_roadmap_task` | После онбординга | GPT-4o генерирует 8-12 персональных этапов развития в JSON |
| `refresh_opportunities` | Ежедневно (Beat) | Заглушка — место для скрапера лагерей/турниров |
| `send_email` | По требованию | Заглушка — место для отправки писем |

**Celery Beat** — планировщик, как cron. Запускает задачи по расписанию (например, каждую ночь обновлять базу возможностей).

---

## 3. Frontend (React + TypeScript) — полный разбор

### 3.1 Роутинг (`frontend/src/app/router.tsx`)

Все страницы загружаются **лениво** (`lazy`) — браузер скачивает только тот код, который нужен прямо сейчас, не весь сразу. Это ускоряет первую загрузку.

**AuthGuard** — защищённый маршрут. Если нет токена в localStorage — редиректит на `/login`.

```
/login          → LoginPage          (публичный)
/recovery       → RecoveryPage       (публичный)
/onboarding     → OnboardingPage     (только авторизованным)
/dashboard      → DashboardPage      (только авторизованным)
/chat           → ChatPage           (только авторизованным)
/chat/:id       → ChatPage           (конкретная сессия)
/roadmap        → RoadmapPage
/calendar       → CalendarPage
/opportunities  → OpportunitiesPage
/profile        → ProfilePage
/subscription   → SubscriptionPage
/settings       → SettingsPage
```

### 3.2 Хранилище состояния (Zustand)

#### `authStore` — авторизация
Хранит `user`, `accessToken`, `refreshToken`, `isAuthenticated`.  
**Персистентность**: токены сохраняются в `localStorage` (ключ `upway-auth`) — пользователь остаётся залогиненным после перезагрузки страницы. Данные пользователя — нет (перезапрашиваются при старте).

#### `chatStore` — чат
Хранит сообщения текущей сессии, флаг `isStreaming`.

#### `playerStore` — профиль игрока
Хранит данные профиля для использования во всём приложении.

### 3.3 HTTP-клиент (`frontend/src/lib/api.ts`)

Axios с двумя перехватчиками:

**Request interceptor** — автоматически добавляет `Authorization: Bearer <token>` к каждому запросу.

**Response interceptor** — при 401 ошибке:
1. Автоматически вызывает `/auth/refresh` с refresh-токеном
2. Повторяет упавший запрос с новым токеном
3. Если refresh тоже не работает — разлогинивает и редиректит на `/login`
4. Все запросы, которые пришли пока шёл refresh, ставятся в очередь и выполняются после

Это значит пользователь **никогда не видит ошибку авторизации** — всё происходит прозрачно.

### 3.4 Страницы и компоненты

#### Онбординг (`features/onboarding/`)

5-шаговый мастер настройки профиля:
1. **StepPlayerInfo** — имя, возраст, рост, вес, амплуа
2. **StepGeography** — страна, город, команда, хоккейная школа
3. **StepLevel** — текущий уровень (с примерами лиг)
4. **StepGoals** — цели (МХЛ, КХЛ, Экстралига, НХЛ...)
5. **StepSkills** — самооценка навыков по 5 параметрам (слайдеры 1-10)

После финального шага: POST `/players/` → Celery автоматически запускает генерацию роадмапа через GPT-4o.

#### Дашборд (`features/dashboard/`)

4 карточки:
- **MetricCard** — прогресс к цели в %, вероятность достижения, скоринг катания
- **RoadmapSummaryCard** — текущая фаза развития
- **UpcomingEventsCard** — ближайшие события из календаря
- **NextStepCard** — следующий рекомендованный шаг

#### Чат (`features/chat/`)

- **ChatWindow** — основной компонент с полем ввода, quick-chips (быстрые подсказки), streaming typing-indicator (три точки)
- **ChatMessage** — рендер сообщений пользователя и ассистента
- **ChatHistory** — список прошлых сессий в сайдбаре
- Стриминг: ответ появляется по словам в реальном времени через SSE

#### Роадмап (`features/roadmap/`)

- **RoadmapTimeline** — визуализация этапов по фазам (todo/active/done)
- **PhaseFilter** — переключение между фазами 1/2/3

#### Профиль (`features/profile/`)

- **PlayerProfileHeader** — фото, имя, уровень, команда
- **ProfileStats** — статистика (рост/вес/возраст/позиция)
- **SkillBars** — визуальные полосы навыков из JSONB

#### Подписка (`features/subscription/`)

- **PlanCards** — 3 тарифных плана (Free / Starter €12 / Pro €29)
- **BillingInfo** — данные об оплате

#### Настройки (`features/settings/`)

4 секции: Язык, Уведомления, Безопасность (смена пароля), Danger Zone (удалить аккаунт)

---

## 4. Инфраструктура

### Docker Compose (`docker-compose.yml`)

6 сервисов:

| Сервис | Образ | Порт | Назначение |
|---|---|---|---|
| `db` | pgvector/pgvector:pg16 | 5432 | PostgreSQL с поддержкой векторов |
| `redis` | redis:7-alpine | 6379 | Брокер задач Celery |
| `backend` | ./backend | 8000 | FastAPI API сервер |
| `worker` | ./backend | — | Celery worker (фоновые задачи) |
| `beat` | ./backend | — | Celery beat (планировщик) |
| `frontend` | ./frontend | 3000 | Vite dev сервер |

Все сервисы имеют healthcheck — Docker не запускает зависимые сервисы пока предыдущий не готов.

---

## 5. Статус реализации

### ✅ Готово и работает

- Регистрация / Вход / Refresh токенов
- Профиль пользователя и игрока (CRUD)
- Онбординг (5 шагов)
- AI-чат с GPT-4o + DeepSeek fallback + стриминг
- RAG сервис (архитектура, нужно наполнить базу знаний)
- Celery worker + Celery beat
- Генерация роадмапа через GPT-4o (async задача после онбординга)
- Роадмап API (чтение, обновление статуса)
- Возможности API (фильтры по типу и стране)
- Подписки API (планы, billing stub)
- Sentry мониторинг
- Yandex Object Storage (конфиг готов)
- Docker Compose (dev)
- Все фронтенд-страницы (скелет)
- Zustand сторы
- Axios с авто-refresh токенов
- PWA конфигурация

### ⚠️ Заглушки (код есть, логика не реализована)

| Компонент | Что не готово |
|---|---|
| `password-reset` | Токен не создаётся, Redis не задействован |
| `send_email` | Celery task пустой, SMTP не настроен |
| `refresh_opportunities` | Скрапер не написан |
| `subscriptions/upgrade` | Возвращает фейковый URL, YooKassa не подключена |
| `subscriptions/billing` | Возвращает хардкоженные данные |
| `/players/me/metrics` | Возвращает заглушку, не считает реальные данные |
| `/players/me/next-step` | Возвращает заглушку |
| RAG knowledge base | Таблица `rag_embeddings` пустая, документов нет |

### ❌ Отсутствует

- Alembic-миграции (папка `versions/` пустая)
- Тесты (unit / integration)
- Nginx конфиг для продакшна
- CI/CD pipeline
- Наполнение базы знаний (документы для RAG)

---

## 6. Как запустить приложение

### Шаг 1. Предварительные требования

Установите на вашем компьютере:
- **Docker Desktop** — https://docs.docker.com/desktop/
- **Git** (если ещё не установлен)

### Шаг 2. Настройте переменные окружения

В папке проекта уже есть файл `.env.example`. Скопируйте его:

```bash
cd UpWay
cp .env.example .env
```

Откройте `.env` и заполните обязательные поля:

```env
# Обязательно — без этого AI не будет работать
OPENAI_API_KEY=sk-ваш-ключ-от-openai

# Опционально — если хотите DeepSeek как резерв
DEEPSEEK_API_KEY=ваш-ключ-deepseek

# Опционально — мониторинг ошибок
SENTRY_DSN=

# Оставьте как есть для разработки
ENVIRONMENT=development
SECRET_KEY=любая-случайная-строка-минимум-32-символа
DATABASE_URL=postgresql+asyncpg://upway:upway@db:5432/upway
REDIS_URL=redis://redis:6379/0
```

> **Получить ключ OpenAI:** https://platform.openai.com/api-keys  
> **Получить ключ DeepSeek:** https://platform.deepseek.com/

### Шаг 3. Запустите все сервисы

```bash
docker-compose up --build
```

Первый запуск займёт 3-5 минут — Docker скачает образы и установит зависимости.

Когда увидите в консоли:
```
backend_1  | INFO:     Application startup complete.
frontend_1 | Local: http://localhost:3000/
```
— всё готово.

### Шаг 4. Создайте таблицы в базе данных

> Примечание: в режиме `development` таблицы создаются автоматически при старте. Если этого не произошло, выполните вручную:

```bash
# В отдельном терминале
docker-compose exec backend alembic upgrade head
```

### Шаг 5. Откройте приложение

Перейдите в браузере: **http://localhost:3000**

---

## 7. Как пользоваться приложением

### Регистрация

1. Откройте http://localhost:3000 — вас автоматически перенаправит на `/login`
2. Нажмите **"Create account"** (или аналогичную ссылку на регистрацию)
3. Введите: имя, email, пароль
4. После регистрации вы автоматически залогинены и получаете JWT-токены

### Онбординг (5 шагов)

После регистрации (если профиль игрока не создан) вас перенаправит на `/onboarding`:

**Шаг 1 — Информация об игроке**
- Имя игрока, возраст, рост (см), вес (кг)
- Позиция: нападающий / защитник / вратарь

**Шаг 2 — География**
- Страна (Беларусь, Россия, и т.д.)
- Город, текущая команда, хоккейная школа

**Шаг 3 — Текущий уровень**
- Детская лига, молодёжная, МХЛ, ВХЛ и т.д.

**Шаг 4 — Цели**
- Что хочет достичь: выйти в МХЛ, попасть в КХЛ, Экстралига, НХЛ...

**Шаг 5 — Оценка навыков**
- Слайдеры от 1 до 10: катание, бросок, пас, физика, хоккейный интеллект

После нажатия **"Finish"**:
- Профиль сохраняется в БД
- Celery-воркер в фоне отправляет запрос к GPT-4o и генерирует персональный роадмап

### Дашборд (`/dashboard`)

Главный экран после онбординга. Показывает:
- Прогресс к цели (%)
- Вероятность достижения цели
- Ближайшие события
- Следующий рекомендованный шаг

### AI-чат (`/chat`)

1. Нажмите **"New Chat"** или кликните на раздел Chat в сайдбаре
2. Задайте любой вопрос:
   - "Как подготовиться к просмотру в МХЛ?"
   - "Какие лагеря выбрать на лето?"
   - "Как улучшить катание за 3 месяца?"
   - "Что есть перед игрой?"
3. AI знает профиль вашего игрока и даёт персональные советы
4. Можно использовать **quick-chips** (кнопки с готовыми вопросами)
5. История сессий сохраняется — можно вернуться к любому разговору

### Роадмап (`/roadmap`)

Персональный план развития, сгенерированный GPT-4o:
- Разбит на 3 фазы (Phase 1/2/3)
- Каждый этап: название, описание, дата, теги
- Статусы: `todo` → `active` → `done`

### Возможности (`/opportunities`)

База лагерей, просмотров, турниров:
- Фильтр по типу: лагерь / просмотр / турнир
- Фильтр по стране

> На данный момент база пустая — нужно наполнить через скрапер или вручную добавить данные в таблицу `opportunities`.

### Профиль (`/profile`)

- Данные игрока с визуальными полосами навыков
- Возможность редактирования

### Подписка (`/subscription`)

Три плана:
- **Free** — 5 AI сообщений/день, базовый роадмап
- **Starter €12/мес** — 50 сообщений/день, полный роадмап, лента возможностей
- **Pro €29/мес** — безлимит, RAG база знаний, сводки о скаутах, приоритетная поддержка

> Оплата пока не подключена — кнопка "Upgrade" возвращает заглушку.

---

## 8. Полезные команды для разработки

```bash
# Запустить всё
docker-compose up

# Пересобрать после изменений
docker-compose up --build

# Остановить
docker-compose down

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f worker

# Открыть bash внутри backend контейнера
docker-compose exec backend bash

# Создать новую Alembic миграцию
docker-compose exec backend alembic revision --autogenerate -m "add some table"

# Применить миграции
docker-compose exec backend alembic upgrade head

# Открыть psql (PostgreSQL CLI)
docker-compose exec db psql -U upway -d upway

# Открыть Redis CLI
docker-compose exec redis redis-cli
```

### Swagger UI (интерактивная документация API)
Доступна только в режиме `development`:  
**http://localhost:8000/api/docs**

Там можно тестировать любой эндпоинт прямо из браузера без Postman.

---

## 9. Что делать дальше (приоритетный порядок)

1. **Alembic-миграции** — создать первоначальную миграцию (`alembic revision --autogenerate`)
2. **Наполнить RAG базу знаний** — добавить документы через `RAGService.ingest_document()`
3. **Email (Celery task)** — подключить SendGrid или SMTP для сброса пароля
4. **Оплата** — интегрировать YooKassa (РФ) и Bepaid/WebPay (РБ)
5. **Скрапер возможностей** — реализовать `refresh_opportunities` task
6. **Метрики** — реализовать расчёт `goal_progress_pct` и `goal_probability_pct`
7. **Тесты** — хотя бы для auth и chat сервисов
8. **Prod Docker Compose** — Nginx как reverse proxy, убрать `--reload`
