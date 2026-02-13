<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false; section>

<#if section = "form">

<script>
    window.onload = function () {
        document.getElementById("kc-continue")?.click();
    }
</script>

<form id="kc-execute-actions-form" action="${url.loginAction}" method="post">
    <input type="hidden" name="confirm" value="true"/>

    <div style="display:none">
        <button id="kc-continue" type="submit">Continue</button>
    </div>
</form>

</#if>

</@layout.registrationLayout>
