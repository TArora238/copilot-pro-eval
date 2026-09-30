<#assign current_url=themeDisplay.URLCurrent!"" />
<#assign menu_id="dxp-mega-menu-" + themeDisplay.getPlid()?c />
<style>
#${menu_id} .dxp-mega-menu__toggle {
   display: none;
}

#${menu_id} .dxp-mega-menu__list,
#${menu_id} .dxp-mega-menu__submenu {
   list-style: none;
   margin: 0;
   padding: 0;
}

#${menu_id} .dxp-mega-menu__list {
   align-items: center;
   display: flex;
   gap: 1.5rem;
}

#${menu_id} .dxp-mega-menu__item {
   position: relative;
}

#${menu_id} .dxp-mega-menu__link {
   color: inherit;
   display: inline-block;
   padding-block: 0.75rem;
   text-decoration: none;
}

#${menu_id} .dxp-mega-menu__link.is-active {
   font-weight: 700;
   text-decoration: underline;
   text-underline-offset: 0.25rem;
}

#${menu_id} .dxp-mega-menu__submenu-toggle {
   background: transparent;
   border: 0;
   color: inherit;
   cursor: pointer;
   margin-inline-start: 0.25rem;
}

#${menu_id} .dxp-mega-menu__dropdown {
   background: #fff;
   box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 15%);
   left: 0;
   min-width: 18rem;
   opacity: 0;
   padding: 1rem;
   position: absolute;
   top: 100%;
   transform: translateY(0.5rem);
   visibility: hidden;
   z-index: 10;
}

#${menu_id} .dxp-mega-menu__item--has-children:hover>.dxp-mega-menu__dropdown,
#${menu_id} .dxp-mega-menu__item--has-children:focus-within>.dxp-mega-menu__dropdown,
#${menu_id} .dxp-mega-menu__item--has-children.is-open>.dxp-mega-menu__dropdown {
   opacity: 1;
   transform: translateY(0);
   visibility: visible;
}

#${menu_id} .dxp-mega-menu__submenu {
   display: grid;
   gap: 0.5rem 1.5rem;
}

#${menu_id} .dxp-mega-menu__submenu--three-columns {
   grid-template-columns: repeat(3, minmax(0, 1fr));
}

#${menu_id} .dxp-mega-menu__submenu--single-column {
   grid-template-columns: 1fr;
}

@media (max-width: 767px) {
   #${menu_id} .dxp-mega-menu__toggle {
      display: inline-flex;
   }

   #${menu_id} .dxp-mega-menu__list {
      display: none;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
   }

   #${menu_id}.is-open .dxp-mega-menu__list {
      display: flex;
   }

   #${menu_id} .dxp-mega-menu__dropdown {
      box-shadow: none;
      display: none;
      opacity: 1;
      padding-inline-start: 1rem;
      position: static;
      transform: none;
      visibility: visible;
   }

   #${menu_id} .dxp-mega-menu__item--has-children.is-open>.dxp-mega-menu__dropdown {
      display: block;
   }

   #${menu_id} .dxp-mega-menu__submenu--three-columns {
      grid-template-columns: 1fr;
   }
}
</style>
<nav aria-label="Primary navigation" class="dxp-mega-menu" id="${menu_id}" role="navigation">
   <button
      aria-controls="${menu_id}-list"
      aria-expanded="false"
      class="dxp-mega-menu__toggle"
      data-menu-toggle
      type="button">
      <span aria-hidden="true">Menu</span>
      <span class="sr-only">Open primary navigation</span>
   </button>
   <ul class="dxp-mega-menu__list" id="${menu_id}-list">
      <#if entries?has_content>
         <#list entries as nav_item>
            <#assign nav_item_layout=nav_item.getLayout()! />
            <#assign nav_item_children=nav_item.getChildren()![] />
            <#assign nav_item_url=nav_item.getURL()!"" />
            <#assign nav_item_has_children=nav_item_children?size gt 0 />
            <#assign nav_item_is_active=nav_item.isSelected() || nav_item_url==current_url />
            <#assign nav_item_is_external=nav_item_layout?? && nav_item_layout.getType()=="url" />
            <#assign submenu_id=menu_id + "-submenu-" + nav_item?index />
            <li class="dxp-mega-menu__item<#if nav_item_has_children> dxp-mega-menu__item--has-children</#if>">
               <a
                  class="dxp-mega-menu__link<#if nav_item_is_active> is-active</#if>"
                  href="${nav_item_url?html}"
                  <#if nav_item_is_active>aria-current="page"
      </#if>
      <#if nav_item_is_external>target="_blank" rel="noopener noreferrer"</#if>
      >
      ${nav_item.getName()?html}
      </a>
      <#if nav_item_has_children>
         <button
            aria-controls="${submenu_id}"
            aria-expanded="false"
            aria-haspopup="true"
            class="dxp-mega-menu__submenu-toggle"
            data-submenu-toggle
            type="button">
            <span aria-hidden="true">Expand ${nav_item.getName()?html} submenu</span>
            <span class="sr-only">Expand ${nav_item.getName()?html} submenu</span>
         </button>
         <div class="dxp-mega-menu__dropdown" id="${submenu_id}">
            <ul class="dxp-mega-menu__submenu <#if nav_item_children?size gt 6>dxp-mega-menu__submenu--three-columns<#else>dxp-mega-menu__submenu--single-column</#if>">
               <#list nav_item_children as nav_item_child>
                  <#assign nav_item_child_layout=nav_item_child.getLayout()! />
                  <#assign nav_item_child_url=nav_item_child.getURL()!"" />
                  <#assign nav_item_child_is_active=nav_item_child.isSelected() || nav_item_child_url==current_url />
                  <#assign nav_item_child_is_external=nav_item_child_layout?? && nav_item_child_layout.getType()=="url" />
                  <li class="dxp-mega-menu__submenu-item">
                     <a
                        class="dxp-mega-menu__link<#if nav_item_child_is_active> is-active</#if>"
                        href="${nav_item_child_url?html}"
                        <#if nav_item_child_is_active>aria-current="page"
      </#if>
      <#if nav_item_child_is_external>target="_blank" rel="noopener noreferrer"</#if>
      >
      ${nav_item_child.getName()?html}
      </a>
      </li>
      </#list>
   </ul>
   </div>
   </#if>
   </li>
   </#list>
   </#if>
   </ul>
</nav>
<script>
(function() {
   var menu = document.getElementById("${menu_id}");
   if (!menu) {
      return;
   }
   var menuToggle = menu.querySelector("[data-menu-toggle]");
   var submenuToggles = menu.querySelectorAll("[data-submenu-toggle]");

   function setSubmenuState(item, isOpen) {
      var toggle = item.querySelector("[data-submenu-toggle]");
      item.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
   }

   function closeOtherSubmenus(currentItem) {
      submenuToggles.forEach(function(toggle) {
         var item = toggle.closest(".dxp-mega-menu__item");
         if (item !== currentItem) {
            setSubmenuState(item, false);
         }
      });
   }
   menuToggle.addEventListener("click", function() {
      var isOpen = menu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
   });
   submenuToggles.forEach(function(toggle) {
      var item = toggle.closest(".dxp-mega-menu__item");
      toggle.addEventListener("click", function() {
         var willOpen = !item.classList.contains("is-open");
         closeOtherSubmenus(item);
         setSubmenuState(item, willOpen);
      });
      item.addEventListener("mouseenter", function() {
         if (window.matchMedia("(min-width: 768px)").matches) {
            closeOtherSubmenus(item);
            setSubmenuState(item, true);
         }
      });
      item.addEventListener("mouseleave", function() {
         if (window.matchMedia("(min-width: 768px)").matches && !item.contains(document.activeElement)) {
            setSubmenuState(item, false);
         }
      });
      item.addEventListener("focusin", function() {
         closeOtherSubmenus(item);
         setSubmenuState(item, true);
      });
      item.addEventListener("focusout", function() {
         window.setTimeout(function() {
            if (!item.contains(document.activeElement)) {
               setSubmenuState(item, false);
            }
         }, 0);
      });
   });
   menu.addEventListener("keydown", function(event) {
      if (event.key !== "Escape") {
         return;
      }
      menu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      submenuToggles.forEach(function(toggle) {
         setSubmenuState(toggle.closest(".dxp-mega-menu__item"), false);
      });
   });
}());
</script>