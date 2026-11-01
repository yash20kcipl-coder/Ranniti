(function () {
  function injectTopNavbar() {
    if (document.getElementById('ranniti-top-navbar')) return;
    const nav = document.createElement('header');
    nav.id = 'ranniti-top-navbar';
    nav.style.cssText =
      'background: #0b1120; border-bottom: 1px solid #1e293b; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.4); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
    nav.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="font-weight: 800; font-size: 18px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">🇮🇳</span>
          <span>Ranniti <span style="background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">API Hub</span></span>
        </div>
        <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
          Port 10001
        </span>
        <span style="background: rgba(56, 189, 248, 0.1); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600;">
          96 Endpoints
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <a href="/api-docs.json" target="_blank" style="text-decoration: none; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;">
          📄 Raw OpenAPI Spec
        </a>
        <a href="/api/v1/health" target="_blank" style="text-decoration: none; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;">
          🩺 Health Check
        </a>
      </div>
    `;
    document.body.prepend(nav);
  }

  function autoExpandAuth() {
    const checkInterval = setInterval(() => {
      const authHeader = document.querySelector('#operations-tag-Authentication');
      if (authHeader) {
        clearInterval(checkInterval);
        const section = authHeader.closest('.opblock-tag-section');
        if (section && !section.classList.contains('is-open')) {
          authHeader.click();
        }
      }
    }, 200);
    setTimeout(() => clearInterval(checkInterval), 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectTopNavbar();
      autoExpandAuth();
    });
  } else {
    injectTopNavbar();
    autoExpandAuth();
  }

  function showToast(message, isSuccess) {
    const existing = document.getElementById('ranniti-swagger-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ranniti-swagger-toast';
    toast.style.position = 'fixed';
    toast.style.top = '72px';
    toast.style.right = '24px';
    toast.style.zIndex = '999999';
    toast.style.padding = '14px 22px';
    toast.style.borderRadius = '14px';
    toast.style.backgroundColor = isSuccess ? '#064e3b' : '#881337';
    toast.style.color = '#ffffff';
    toast.style.border = isSuccess ? '1px solid #10b981' : '1px solid #f43f5e';
    toast.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.7)';
    toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    toast.style.fontSize = '14px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '14px';
    toast.style.animation = 'fadeIn 0.3s ease';

    toast.innerHTML = `
      <span style="font-size: 24px;">${isSuccess ? '🔐' : '⚠️'}</span>
      <div>
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px;">${isSuccess ? 'Auto-Authorized in Swagger' : 'Notice'}</div>
        <div style="font-size: 13px; opacity: 0.95;">${message}</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 5500);
  }

  function handleLoginSuccess(url, responseData) {
    try {
      const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      const token = data?.data?.token || data?.token || data?.data?.accessToken;
      const user = data?.data?.user || data?.user;
      const role = user?.role || user?.roleName || 'Authenticated';
      const name = user?.name || user?.email || user?.phone || 'User';
      const tenantDb = data?.data?.tenantDbName || user?.tenantDbName || user?.tenant_db_name;

      if (token && window.ui) {
        window.ui.preauthorizeApiKey('bearerAuth', token);

        if (tenantDb) {
          window.ui.preauthorizeApiKey('tenantDbHeader', tenantDb);
        }

        const msg = tenantDb
          ? `Authenticated as <b>${name}</b> (${role})<br>Tenant DB: <code>${tenantDb}</code>`
          : `Authenticated as <b>${name}</b> (${role})<br>Bearer token automatically attached!`;

        showToast(msg, true);
        console.log('✅ Swagger Auto-Authorized:', { name, role, tenantDb });
      }
    } catch (err) {
      console.warn('Swagger auto-auth error:', err);
    }
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

    if (
      url.includes('/auth/login') ||
      url.includes('/mobile/auth/login') ||
      url.includes('/mobile/auth/verify-mpin') ||
      url.includes('/mobile/auth/verify-otp')
    ) {
      if (response.ok) {
        response.clone().json().then((data) => {
          handleLoginSuccess(url, data);
        }).catch(() => {});
      }
    }
    return response;
  };

  // Intercept XMLHttpRequest fallback
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._reqUrl = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function (...rest) {
    this.addEventListener('load', function () {
      if (
        this._reqUrl &&
        (this._reqUrl.includes('/auth/login') ||
          this._reqUrl.includes('/mobile/auth/login') ||
          this._reqUrl.includes('/mobile/auth/verify-mpin') ||
          this._reqUrl.includes('/mobile/auth/verify-otp'))
      ) {
        if (this.status >= 200 && this.status < 300) {
          handleLoginSuccess(this._reqUrl, this.responseText);
        }
      }
    });
    return originalSend.apply(this, rest);
  };
})();
