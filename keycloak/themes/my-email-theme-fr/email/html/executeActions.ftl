<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Action requise - SatMonitor</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #337027; padding: 20px; color: white; text-align: center;">
        <h1>SatMonitor</h1>
        <p>Action requise pour votre compte</p>
    </div>
    
    <div style="padding: 25px; background: #f9f9f9; border: 1px solid #e0e0e0;">
        <p>Bonjour <strong>${user.firstName!'Cher utilisateur'}</strong>,</p>
        <p>Vous avez demandé les actions suivantes pour votre compte :</p>
        
        <div style="background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #337027;">
            <#if requiredActions?seq_contains("VERIFY_EMAIL")>
                <p><strong>✓ Vérification d'adresse email</strong></p>
            </#if>
            <#if requiredActions?seq_contains("UPDATE_PASSWORD")>
                <p><strong>✓ Mise à jour du mot de passe</strong></p>
            </#if>
            <#if requiredActions?seq_contains("CONFIGURE_TOTP")>
                <p><strong>✓ Configuration de l'authentification à deux facteurs</strong></p>
            </#if>
        </div>
        
        <p>Pour compléter ces actions, veuillez cliquer sur le lien ci-dessous :</p>
        
        <p style="text-align: center; margin: 25px 0;">
            <a href="${link}" 
               style="background: #337027; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; 
                      font-weight: bold; display: inline-block;">
               🔗 Accéder aux actions
            </a>
        </p>
        
        <p><em>Ce lien est valable pour les 24 prochaines heures.</em></p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        
        <p style="font-size: 14px; color: #666;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.<br>
            <strong>L'équipe SatMonitor</strong>
        </p>
    </div>
</body>
</html>