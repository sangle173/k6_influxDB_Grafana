@echo off
echo Running Laravel database migrations and seeders...
cd %~dp0..\backend-laravel
php artisan migrate:fresh --seed
echo Migrations and seeders completed successfully!
pause
