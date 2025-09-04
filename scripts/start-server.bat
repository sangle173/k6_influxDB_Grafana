@echo off
echo Starting Laravel development server...
cd %~dp0..\backend-laravel
php artisan serve
