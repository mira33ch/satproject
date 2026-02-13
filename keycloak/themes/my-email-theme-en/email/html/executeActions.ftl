<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${msg("email.executeActions.subject")} - SatMonitor</title>
</head>
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <div style="background: #337027; padding: 20px; color: white; text-align: center;">
        <h1>SatMonitor</h1>
        <p>${msg("email.executeActions.subject")}</p>
    </div>
    
    <div style="padding: 20px; background: #f9f9f9;">
        <p><strong>${msg("email.executeActions.greeting")} ${user.firstName!'Utilisateur'},</strong></p>
        <p>${msg("email.executeActions.intro")} :</p>
        
        <#if requiredActions?seq_contains("VERIFY_EMAIL")>
        <p>✅ <strong>${msg("email.executeActions.verifyEmail")}</strong></p>
        </#if>
        
        <p>${msg("email.executeActions.linkPrompt")} :</p>
        <p style="text-align: center; margin: 20px 0;">
            <a href="${link}" style="background: #337027; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🔗 ${msg("email.executeActions.verifyEmail")}
            </a>
        </p>
        
        <p><em>${msg("email.executeActions.linkValid")}.</em></p>
        
        <hr style="margin: 25px 0;">
        <p style="font-size: 12px; color: #666;">
            ${msg("email.executeActions.signature")}<br>
            <strong>SatMonitor</strong>
        </p>
    </div>
</body>
</html>