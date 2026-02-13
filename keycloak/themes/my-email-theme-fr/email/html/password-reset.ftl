<#ftl output_format="HTML" encoding="UTF-8">
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe - SATMONITOR</title>
    
  
    
    <!-- CSS inline de secours (pour certains clients email) -->
    <style type="text/css">
        /* Copie des styles essentiels en inline */
        body { margin:0; padding:40px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#000; line-height:1.6; background:#fff; }
        .container { max-width:500px; margin:0 auto; }
        .logo-container { text-align:center; margin-bottom:40px; }
        .logo { max-width:180px; height:auto; }
        .email-highlight { color:#337027; font-weight:600; background:#f8fff8; padding:2px 6px; border-radius:3px; }
        .button-container { text-align:center; margin:30px 0; }
        .reset-button { display:inline-block; background:#337027; color:#fff; text-decoration:none; padding:14px 50px; border-radius:6px; font-weight:600; font-size:15px; min-width:250px; }
        .warning { font-size:13px; color:#666; margin-top:30px; }
    </style>
</head>
<body>
    
    <div class="container">
   

        
<img src="/resources/ckfcv/login/my-email-theme-fr/img/stamonitor.png" alt="Logo SATMONITOR" class="logo" />

        <!-- Texte (aligné à gauche) -->
        <div class="text-left">
            
            <p class="greeting">Bonjour ${user.firstName!user.username!"Utilisateur"},</p>
            
            <p class="message">
                Vous avez demandé la réinitialisation du mot de passe pour votre compte 
                <span class="email-highlight">${user.email!"votre compte"}</span>.
            </p>
            
            <p class="instruction">Cliquez sur le bouton ci-dessous :</p>
            
        </div>
        
        <!-- Bouton centré -->
        <div class="button-container">
            <a href="${link}" class="reset-button">
                Réinitialiser mon mot de passe
            </a>
        </div>
        
        <!-- Avertissement -->
        <div class="warning">
            <p>
                Si vous n'avez pas fait cette demande, ignorez cet e-mail.<br>
                Votre mot de passe restera inchangé.
            </p>
        </div>
        
        <!-- Signature -->
        <div class="signature">
            <p>Merci,<br>L'équipe SATMONITOR</p>
        </div>
        
    </div>
    
</body>
</html>