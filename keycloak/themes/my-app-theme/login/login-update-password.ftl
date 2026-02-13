<#import "template.ftl" as layout>

<@layout.registrationLayout displayInfo=false; section>

<#if section = "form">

<!-- Background et overlay -->
<div class="kc-login-background"></div>
<div class="kc-login-overlay"></div>


<div class="kc-navbar" 
     style="
        display:flex; 
        align-items:center; 
        justify-content:space-between; 
        padding:15px 30px; 
        background:#fff; 
        box-shadow:0 4px 8px rgba(0,0,0,0.1); 
        position:fixed; 
        top:20px;      /* space from top */
        left:30px;     /* space from left */
        right:30px;    /* space from right */
        border-radius:12px;   /* rounded corners */
        z-index:20;
     ">
  
    <!-- Brand -->
    <div style="display:flex; align-items:center; gap:12px;">
        <img 
            src="${url.resourcesPath}/img/logo.png" 
            alt="SatMonitor" 
            style="height:42px; width:42px; object-fit:contain;"
        />

        <div style="line-height:1.1;">
 <div style="
        font-weight:800;
        letter-spacing:0.04em;
        color:#111827;
        font-size:16px;
    ">
        SATMONITOR
    </div>

    <div style="
        margin-top:6px;
        font-size:11px;
        color:#6b7280;
    ">
        Global phenomena tracking
    </div>
            
        </div>
    </div>
</div>




<!-- Container principal -->
<div class="kc-container">
    <div class="kc-card">

        <h1>Réinitialisation mot de passe</h1>
      
        <form action="${url.loginAction}" method="post">
            <label>Nouveau mot de passe</label>
            <input class="kc-input"
                   type="password"
                   name="password-new"
                   placeholder="Entrer un nouveau mot de passe" />

            <label style="margin-top:10px">Confirmer le mot de passe</label>
            <input class="kc-input"
                   type="password"
                   name="password-confirm"
                   placeholder="Confirmer le nouveau mot de passe" />

            <button class="kc-btn" type="submit">
                Confirmer
            </button>

        </form>

    </div>
</div>

</#if>

</@layout.registrationLayout>
