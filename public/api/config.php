<?php
// Plesk Database Configuration File
// Update these settings with your MySQL details inside Plesk File Manager!

define('DB_HOST', 'localhost');
define('DB_NAME', 'YOUR_DATABASE_NAME');
define('DB_USER', 'YOUR_DATABASE_USER');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD');

// Google OAuth Configuration
// Obtain these from Google Developer Console (https://console.cloud.google.com)
define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID');
define('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET');
define('GOOGLE_REDIRECT_URI', 'https://YOUR_DOMAIN.com/api/index.php?action=google_callback');
