# GraveHub — тільки фронтенд

React + TypeScript + Axios. Цей архів не містить бекенду, патчів бекенду або команд його зміни. Фронтенд використовує API наявного gravehub-backend, перевіреного на commit 3b56efc.

## Запуск

1. Розпакуй архів і відкрий папку gravehub-frontend у VS Code.
2. Запусти свій бекенд окремо, як зазвичай.
3. У терміналі папки фронтенду:

```bash
npm install
npm run dev -- --port 5173 --strictPort
```

4. Відкрий http://localhost:5173.

Архів містить .env з VITE_API_URL=http://localhost:3000. Якщо бекенд працює за іншою адресою, зміни її й перезапусти фронтенд. Для cookie та CORS використовуй той origin, який уже дозволено бекендом; типове значення http://localhost:5173. Не змішуй localhost і 127.0.0.1.

Без VITE_API_URL фронтенд відкриває деморежим. Щоб використовувати API, залиш змінну заповненою.

## Git Bash: додати фронт до свого репозиторію

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/yarty777-Vdovichenko/gravehub-frontend.git
cd gravehub-frontend
git switch -c feature/gravehub-ui
```

Скопіюй вміст папки gravehub-frontend з архіву в клонований репозиторій, замінивши однойменні файли. Папку .git не видаляй. Архів не містить .git. Якщо ти вже маєш незакомічені зміни, спочатку збережи їх окремо.

```bash
npm install
npm run build
node tests/contracts.mjs
npm run dev -- --port 5173 --strictPort
```

Після перевірки зупини dev-сервер Ctrl+C й виконай:

```bash
git status
git add .gitignore .env.example README.md index.html package.json package-lock.json tsconfig.json vite.config.ts src tests
git commit -m "Integrate GraveHub frontend with existing API"
git push -u origin feature/gravehub-ui
```

Створи Pull Request із feature/gravehub-ui в master у GitHub. .env не коміть. Для подальшого отримання змін із GitHub використовуй git pull --ff-only у чистій робочій копії та npm install.

## Інтеграція

- Вхід повертає {accessToken}; реєстрація повертає повідомлення про створення акаунта й вимагає підтвердження пошти. Посилання з листа обробляється через POST /auth/verify-email, а на екрані входу можна повторно надіслати лист через POST /auth/resend-verification. Після підтвердження користувач входить окремо. Поточний режим береться з JWT role лише для UI; авторизацію перевіряє сервер.
- Після входу, оновлення токена, перемикання режиму чи додавання ролі фронтенд запитує `GET /auth/me`; endpoint повертає ім’я, пошту, повний список ролей і активний режим. Ролі сайдбара та форми профілю беруться з цієї відповіді.
- Пошук /employees і /employee/contracts використовує items + meta.pages. Інші існуючі списки підтримують items/total/totalPages.
- Список роботи виконавця завантажується з /employee/my-contracts/my?page=…&limit=….
- Кладовища, ділянки та придбані місця використовують масиви відповідно до API; резервування, скасування, credit-preview і purchase надсилають тільки дозволені поля.
- Access token лише в пам’яті, withCredentials=true, single-flight refresh і один повтор 401. localStorage/sessionStorage не використовуються.
- Карта використовує локальне SVG-зображення з географічною межею України від geoBoundaries/OpenStreetMap (ODbL 1.0); маркери кладовищ розміщуються за latitude/longitude. Схема місць відображає positionX/positionY. Ціни, статуси та результати покупки беруться із сервера.

## Важливі примітки

У перевіреному коді бекенду PlotsModule підключений до AppModule, а маршрути /cemeteries і /plots захищені роллю customer. Якщо запущений сервер відповідає 404, це може означати, що він працює на старішій збірці; відсутній на сервері endpoint неможливо додати змінами фронтенду. Для cookie та CORS значення VITE_API_URL у фронтенді має відповідати адресі API, а дозволений бекендом origin — адресі фронтенду.

Розрахунок кредиту повертає бекенд через /plots/:id/credit-preview. Купівля потребує активного власного резерву. Таймер на екрані не зберігається після переходу/перезавантаження, але серверний резерв діє до reservedUntil; фронтенд показує успіх лише після відповіді сервера.

Перевірено: TypeScript/Vite build і тести контрактів запитів. Повний цикл з живою PostgreSQL і реальним запущеним бекендом у цій версії не перевірявся.
