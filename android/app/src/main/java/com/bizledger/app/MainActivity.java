package com.bizledger.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {

    private int lastTopDp = 0;
    private int lastBottomDp = 0;
    private int lastLeftDp = 0;
    private int lastRightDp = 0;
    private int lastImeBottomDp = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupEdgeToEdgeAndBars();
    }

    private void setupEdgeToEdgeAndBars() {
        Window window = getWindow();

        // 1. Enable full-bleed edge-to-edge layout across Android 10 to 15+
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // 2. Set status bar (#2563EB) and navigation bar (#FFFFFF) colors
        int headerBlue = Color.parseColor("#2563EB");
        int bottomNavBg = Color.parseColor("#FFFFFF");

        window.setStatusBarColor(headerBlue);
        window.setNavigationBarColor(bottomNavBg);

        WindowInsetsControllerCompat insetsController = new WindowInsetsControllerCompat(window, window.getDecorView());
        // Status bar icons should be light (white) on top of the blue header
        insetsController.setAppearanceLightStatusBars(false);
        // Navigation bar buttons should be dark on top of the white bottom nav
        insetsController.setAppearanceLightNavigationBars(true);

        // 3. Listen for window insets (status bar, navigation bar, cutouts, and IME keyboard)
        ViewCompat.setOnApplyWindowInsetsListener(window.getDecorView(), (v, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

            float density = getResources().getDisplayMetrics().density;
            if (density <= 0) density = 1.0f;

            lastTopDp = Math.round(systemBars.top / density);
            lastBottomDp = Math.round(systemBars.bottom / density);
            lastLeftDp = Math.round(systemBars.left / density);
            lastRightDp = Math.round(systemBars.right / density);
            lastImeBottomDp = Math.round(ime.bottom / density);

            injectInsetsToWebView();

            return windowInsets;
        });
    }

    public void injectInsetsToWebView() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        final WebView webView = getBridge().getWebView();
        final String js = String.format(Locale.US,
            "(function() {" +
            "  var r = document.documentElement;" +
            "  if (r) {" +
            "    r.style.setProperty('--safe-top', '%dpx');" +
            "    r.style.setProperty('--safe-bottom', '%dpx');" +
            "    r.style.setProperty('--safe-left', '%dpx');" +
            "    r.style.setProperty('--safe-right', '%dpx');" +
            "    r.style.setProperty('--keyboard-height', '%dpx');" +
            "  }" +
            "})();",
            lastTopDp, lastBottomDp, lastLeftDp, lastRightDp, lastImeBottomDp
        );

        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    public void onResume() {
        super.onResume();
        Window window = getWindow();
        if (window != null && window.getDecorView() != null) {
            WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(window.getDecorView());
            if (rootInsets != null) {
                Insets systemBars = rootInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                Insets ime = rootInsets.getInsets(WindowInsetsCompat.Type.ime());
                float density = getResources().getDisplayMetrics().density;
                if (density <= 0) density = 1.0f;

                lastTopDp = Math.round(systemBars.top / density);
                lastBottomDp = Math.round(systemBars.bottom / density);
                lastLeftDp = Math.round(systemBars.left / density);
                lastRightDp = Math.round(systemBars.right / density);
                lastImeBottomDp = Math.round(ime.bottom / density);
            }
        }
        injectInsetsToWebView();
    }
}
