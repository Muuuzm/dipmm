# Студия Престиж — Android-клиент

Отдельное легкое Android-приложение для обычных клиентов парикмахерской. В приложении нет административного входа, панели управления, статистики, просмотра всех заявок, admin API и служебных токенов.

## Архитектура

- Android-приложение: Kotlin, Jetpack Compose, Material 3.
- Сеть: HTTPS/JSON через OkHttp.
- Локальное хранение: DataStore Preferences.
- Сервер: Next.js API.
- База: Prisma + SQLite на сервере.

Схема:

```text
Android client -> HTTPS JSON -> Next.js backend -> Prisma -> SQLite
```

Приложение не подключается к базе напрямую и не содержит серверных секретов.

## Base URL

```text
https://parih.svoiprox.pro
```

Задается в `android-client/app/build.gradle.kts`:

```kotlin
buildConfigField("String", "PUBLIC_BASE_URL", "\"https://parih.svoiprox.pro\"")
```

## Публичные API

Приложение использует только клиентские публичные API:

```text
GET  /api/public/salon
GET  /api/public/services
GET  /api/public/masters
GET  /api/public/masters?date=YYYY-MM-DD&service=service-slug
GET  /api/availability?date=YYYY-MM-DD&master=...&service=service-slug
POST /api/appointments
GET  /api/public/appointments/by-token/:publicToken
```

`POST /api/appointments` после создания записи возвращает `publicToken`. Клиент сохраняет этот токен и использует его для просмотра только своей записи.

## Локально сохраняемые данные

В DataStore сохраняются:

- имя клиента;
- телефон клиента;
- `publicToken` последней записи;
- кэш последней успешно загруженной записи.

Локальная база данных, Room, Firebase, WebView, аналитика и реклама не используются.

## Экраны

- Главная: краткая информация о салоне, преимущества, режим работы, ближайшая запись.
- Услуги: список услуг с сервера, цены и длительность.
- Запись: пошаговая запись клиента.
- Моя запись: просмотр собственной записи по `publicToken`, обновление статуса с сервера.

## Сборка

Из-за кириллицы в пути Windows проект удобнее собирать из ASCII-директории или через временную копию.

```powershell
$env:JAVA_HOME = Join-Path $env:TEMP 'jdk-21-portable\jdk-21.0.11+10'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
& "$env:TEMP\gradle-8.14.3\bin\gradle.bat" -p android-client :app:assembleDebug :app:assembleRelease :app:bundleRelease
```

## Артефакты

Готовые файлы лежат в `android-client/artifacts`:

```text
prestige-client-debug.apk             10.06 MB
prestige-client-release-unsigned.apk   1.31 MB
prestige-client-release.aab            2.96 MB
```

Release APK собран без подписи production-ключом. Для публикации нужно подписать APK/AAB своим keystore.

## Безопасность

В APK нет:

- SSH IP, login и password;
- `ADMIN_LOGIN`;
- `ADMIN_PASSWORD`;
- `ADMIN_SESSION_SECRET`;
- административных токенов;
- обращений к `/api/admin/*`.

Клиент видит только свою запись через длинный случайный `publicToken`, а не через последовательный ID.
