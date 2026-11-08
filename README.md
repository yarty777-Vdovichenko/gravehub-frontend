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

- Авторизація працює з відповіддю {accessToken}; звернень до відсутнього /auth/me немає. Поточний режим береться з JWT role лише для UI; авторизацію перевіряє сервер.
- Ім’я/пошта поточного користувача та повний список ролей недоступні у чинному auth-контракті: відображається загальне ім’я й активна роль. Відсутні поля не вигадуються.
- Пошук /employees і /employee/contracts використовує items + meta.pages. Інші існуючі списки підтримують items/total/totalPages.
- Кладовища, ділянки та придбані місця використовують масиви відповідно до API; резервування, скасування, credit-preview і purchase надсилають тільки дозволені поля.
- Access token лише в пам’яті, withCredentials=true, single-flight refresh і один повтор 401. localStorage/sessionStorage не використовуються.
- Схема кладовищ показує маркери за latitude/longitude без картографічної підкладки; схема місць відображає positionX/positionY. Ціни, статуси та результати покупки беруться із сервера.

## Важливе обмеження поточного бекенду

У перевіреній версії репозиторію PlotsModule не підключений до AppModule. Тому сервер може відповідати 404 на /cemeteries і /plots навіть за наявності їхнього коду в репозиторії. Фронтенд показує повідомлення про недоступність маршруту. Обійти відсутній HTTP endpoint лише змінами фронтенду неможливо; у цьому архіві бекенд не змінюється.

Контролер місць у перевіреному коді також не має JwtAuthGuard/RolesGuard, потрібних для req.user. Якщо власник бекенду увімкне модуль, ці захисні механізми мають бути забезпечені на сервері. Фронтенд не може встановити серверний req.user чи замінити авторизацію.

Кредит — мок-розрахунок API. Купівля потребує активного власного резерву. Таймер резерву зберігається лише до переходу зі сторінки/перезавантаження; серверний резерв продовжує діяти до reservedUntil. Фронтенд не обіцяє успіху до відповіді сервера.

Перевірено: TypeScript/Vite build і тести контрактів запитів. Повний цикл з живою PostgreSQL і реальним запущеним бекендом у цій версії не перевірявся.
