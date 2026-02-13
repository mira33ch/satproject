<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false; section>

<#if section = "form">

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

<div class="kc-container">
    <div class="kc-card">

        <h1>Mot de passe oublié</h1>
      

        <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
            
            <label>Email</label>
            <input class="kc-input" type="text" id="username" name="username" placeholder="exemple@gmail.com" autofocus />

            <button class="kc-btn" type="submit" style="margin-top: 15px;">
                Confirmer
            </button>
        </form>

    </div>
</div>

</#if>
</@layout.registrationLayout>
