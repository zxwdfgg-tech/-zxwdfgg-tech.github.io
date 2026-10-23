package cn.electricintel.market;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.view.View;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceError;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String PUBLIC_URL = "https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/overseas/electric-intel/";
    private static final String ASSET_ORIGIN = "https://appassets.androidplatform.net";
    private static final String LOCAL_URL = ASSET_ORIGIN + "/assets/site/index.html";
    private static final int SAVE_CSV = 1056;
    private WebView webView;
    private TextView modeLabel;
    private boolean online = false;
    private byte[] pendingCsv;
    private String pendingName;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(18, 40, 59));
        getWindow().setNavigationBarColor(Color.rgb(18, 40, 59));
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(14), 0, dp(10), 0);
        toolbar.setBackgroundColor(Color.rgb(18, 40, 59));
        root.addView(toolbar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));

        TextView title = new TextView(this);
        title.setText("⚡ 电力情报站");
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        modeLabel = actionLabel("离线资料");
        modeLabel.setTextColor(Color.rgb(119, 218, 205));
        toolbar.addView(modeLabel);
        TextView local = actionLabel("本地");
        toolbar.addView(local);
        local.setOnClickListener(v -> openOffline());
        TextView network = actionLabel("在线");
        toolbar.addView(network);
        network.setOnClickListener(v -> openOnline());

        webView = new WebView(this);
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setBuiltInZoomControls(false);
        if (Build.VERSION.SDK_INT >= 21) settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!"https".equals(u.getScheme()) || !"appassets.androidplatform.net".equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || !path.startsWith("/assets/site/")) return null;
                String relative = path.substring("/assets/site/".length());
                if (relative.isEmpty()) relative = "index.html";
                if (relative.contains("..") || relative.startsWith("/") || relative.contains("\\")) return null;
                try {
                    InputStream input = getAssets().open("site/" + relative);
                    String mime = "application/octet-stream";
                    if (relative.endsWith(".html")) mime = "text/html";
                    else if (relative.endsWith(".js")) mime = "application/javascript";
                    else if (relative.endsWith(".css")) mime = "text/css";
                    else if (relative.endsWith(".svg")) mime = "image/svg+xml";
                    return new WebResourceResponse(mime, "UTF-8", input);
                } catch (FileNotFoundException ex) {
                    return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                } catch (Exception ex) { return null; }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri u = request.getUrl();
                String target = u.toString();
                if (target.startsWith(ASSET_ORIGIN + "/assets/site/")) return false;
                if (target.startsWith(PUBLIC_URL)) return false;
                if (!"http".equals(u.getScheme()) && !"https".equals(u.getScheme())) return true;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ex) {
                    Toast.makeText(MainActivity.this, "设备未找到可打开链接的应用", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (online && request.isForMainFrame() && !request.getUrl().toString().startsWith(ASSET_ORIGIN)) {
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "在线网页不可达，已切回内置资料", Toast.LENGTH_LONG).show();
                        openOffline();
                    });
                }
            }
        });
        openOffline();
    }

    private int dp(float value) {
        return Math.round(getResources().getDisplayMetrics().density * value);
    }
    private TextView actionLabel(String text) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextColor(Color.WHITE);
        v.setTextSize(12);
        v.setPadding(dp(8), dp(10), dp(8), dp(10));
        v.setGravity(Gravity.CENTER);
        return v;
    }
    private void openOffline() {
        online = false;
        webView.removeJavascriptInterface("PowerAndroid");
        webView.addJavascriptInterface(new NativeApi(), "PowerAndroid");
        modeLabel.setText("离线资料");
        webView.loadUrl(LOCAL_URL);
    }
    private void openOnline() {
        online = true;
        // The native file-saving bridge is intentionally unavailable to remote websites.
        webView.removeJavascriptInterface("PowerAndroid");
        modeLabel.setText("在线版");
        webView.loadUrl(PUBLIC_URL);
    }

    public class NativeApi {
        @JavascriptInterface public String publicSiteUrl() { return PUBLIC_URL; }
        @JavascriptInterface public void exportCsv(String csv, String filename) {
            if (csv == null || csv.length() > 12_000_000) return;
            final byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
            final String file = (filename == null || !filename.endsWith(".csv")) ? "电力情报.csv" : filename;
            runOnUiThread(() -> {
                pendingCsv = bytes;
                pendingName = file;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("text/csv");
                i.putExtra(Intent.EXTRA_TITLE, pendingName);
                startActivityForResult(i, SAVE_CSV);
            });
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SAVE_CSV && resultCode == RESULT_OK && data != null && pendingCsv != null) {
            try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
                if (output != null) {
                    output.write(pendingCsv);
                    Toast.makeText(this, "CSV 已保存", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception ex) {
                Toast.makeText(this, "文件保存失败，请重试", Toast.LENGTH_SHORT).show();
            }
        }
        pendingCsv = null;
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
