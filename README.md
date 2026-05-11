# VetCare

VetCare is a web system for a veterinary clinic with separate dashboards for pet owners, veterinarians, and administrators.

## Features

- Registration and login by role
- Pet owner dashboard
- Pet profiles
- Appointment booking and confirmation
- Veterinarian schedule
- Patient list
- Medical records
- Vaccination and reminder calendar
- Admin dashboard
- MySQL-backed data storage through a PHP API

## Local Setup With MySQL

1. Install XAMPP, MAMP, OpenServer, or another PHP + MySQL environment.
2. Copy this project folder into the web server folder, for example `htdocs/VetCare`.
3. Create the database by importing `database.sql` in phpMyAdmin.
4. If your MySQL login is not `root` with an empty password, update `api/config.php`.
5. Open the project in the browser:

```text
http://localhost/VetCare/
```

## Demo Accounts

```text
Client: client@vetcare.ru / client123
Veterinarian: vet@vetcare.ru / vet123
Admin: admin@vetcare.ru / admin123
```

## Notes

The browser keeps only the current login session locally. Clinic data is stored in MySQL through `api/store.php`.
