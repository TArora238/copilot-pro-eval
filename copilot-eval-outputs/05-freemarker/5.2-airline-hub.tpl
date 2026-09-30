<#--
    Liferay 7.4 layout template context:
    themeDisplay is supplied by the theme/layout rendering pipeline. It exposes the
    current company, locale, layout, and the original servlet request.
-->
<#assign current_layout=themeDisplay.getLayout() />
<#-- request is the original HttpServletRequest obtained from ThemeDisplay. Use it for URL parameters. -->
<#assign request=themeDisplay.getRequest() />

<#--
    Airline-code precedence:
    1. URL parameter is useful for preview links and campaign landing pages.
    2. The layout custom field is the persistent page-level default.
    3. A web-content field should be supplied by the consuming portlet as request attribute
       "AIRLINE_CODE"; a layout template cannot select an arbitrary article safely itself.
-->
<#assign article_airline_code=(request.getAttribute("AIRLINE_CODE"))!"" />
<#assign url_airline_code=(request.getParameter("airlineCode"))!"" />
<#-- current_layout is Liferay's Layout model; its ExpandoBridge stores custom fields. -->
<#assign layout_airline_code=(current_layout.getExpandoBridge().getAttribute("airlineCode"))!"" />
<#assign airline_code=layout_airline_code />
<#if article_airline_code?has_content>
    <#assign airline_code=article_airline_code />
</#if>
<#if url_airline_code?has_content>
    <#assign airline_code=url_airline_code />
</#if>
<#if !airline_code?has_content>
    <#assign airline_code="STAR" />
</#if>
<#assign airline_code=airline_code?upper_case />

<#-- Keep the configured list in theme settings or a shared FTL include in production. -->
<#assign rtl_airline_codes=["MS", "RJ"] />
<#assign text_direction="ltr" />
<#if rtl_airline_codes?seq_contains(airline_code)>
    <#assign text_direction="rtl" />
</#if>

<#--
    themeDisplay.getLocale() is the current Liferay display locale. CMS dates are normalized
    to a Date instance by the article/portlet before being passed to this macro.
-->
<#macro formatCmsDate cms_date>
    <#if cms_date??>
        ${cms_date?string("dd MMM yyyy", themeDisplay.getLocale())}
    </#if>
</#macro>

<#--
    Layout templates reliably receive themeDisplay, but not necessarily a top-level
    permissionChecker binding. getAllRoles() includes the current user's direct and inherited
    roles; use getRoles() instead when PREMIER_MEMBER must be directly assigned only.
-->
<#assign current_user=themeDisplay.getUser() />
<#assign is_premier_member=false />
<#list current_user.getAllRoles() as role>
    <#if role.getName()=="PREMIER_MEMBER">
        <#assign is_premier_member=true />
        <#break>
    </#if>
</#list>

<div class="airline-hub" data-airline="${airline_code?html}" dir="${text_direction}">
    <#if is_premier_member>
        <aside class="airline-hub__premier-banner" aria-label="Premier member benefits">
            <p>Premier Member Banner</p>
        </aside>
    </#if>

    <#-- processor is available only in a Liferay layout template and renders the page's configured portlet columns. -->
    <div class="airline-hub__grid">
        <section class="airline-hub__column airline-hub__column--primary" aria-label="Main content">
            ${processor.processColumn("column-1", "portlet-column-content portlet-column-content-first")}
        </section>
        <aside class="airline-hub__column airline-hub__column--secondary" aria-label="Supporting content">
            ${processor.processColumn("column-2", "portlet-column-content")}
        </aside>
        <aside class="airline-hub__column airline-hub__column--tertiary" aria-label="Travel tools">
            ${processor.processColumn("column-3", "portlet-column-content portlet-column-content-last")}
        </aside>
    </div>
</div>