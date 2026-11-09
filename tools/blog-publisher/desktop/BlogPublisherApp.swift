import AppKit
import Foundation
import WebKit

private struct PublisherConfig: Decodable {
    let root: String
    let port: Int
    let publisherUiVersion: Int?
}

private enum ConnectionResult {
    case ready(port: Int, process: Process?)
    case failed(String)
}

final class BlogPublisherApp: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate, WKUIDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var statusLabel: NSTextField!
    private var repository: URL?
    private var serverProcess: Process?
    private var activePort: Int?
    private var isConnecting = false
    private var hasLoadedWriter = false
    private var healthTimer: Timer?
    private let serviceQueue = DispatchQueue(label: "top.haibin.blogpublisher.service", qos: .userInitiated)

    func applicationDidFinishLaunching(_ notification: Notification) {
        makeWindow()
        makeMenu()
        repository = configuredRepository()
        if repository == nil {
            chooseRepository(nil)
        } else {
            connect()
        }
        healthTimer = Timer.scheduledTimer(withTimeInterval: 8, repeats: true) { [weak self] _ in
            self?.checkHealth()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationWillTerminate(_ notification: Notification) {
        healthTimer?.invalidate()
        if serverProcess?.isRunning == true { serverProcess?.terminate() }
    }

    private func makeWindow() {
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1220, height: 860),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Haibin Blog Publisher"
        window.minSize = NSSize(width: 850, height: 600)
        window.delegate = self

        let container = NSView()
        window.contentView = container
        let toolbar = NSStackView()
        toolbar.orientation = .horizontal
        toolbar.alignment = .centerY
        toolbar.spacing = 10
        toolbar.edgeInsets = NSEdgeInsets(top: 0, left: 18, bottom: 0, right: 18)
        toolbar.translatesAutoresizingMaskIntoConstraints = false

        let newButton = button("新建文章", symbol: "square.and.pencil", action: #selector(newPost))
        let managerButton = button("文章管理", symbol: "tray.full", action: #selector(openManager))
        let blogButton = button("查看博客", symbol: "book", action: #selector(openBlog))
        let checkButton = button("检测发布", symbol: "arrow.clockwise", action: #selector(checkPublish))
        let folderButton = button("博客目录", symbol: "folder", action: #selector(chooseRepository(_:)))
        statusLabel = NSTextField(labelWithString: "正在连接本地服务…")
        statusLabel.alignment = .right
        statusLabel.textColor = .secondaryLabelColor
        statusLabel.lineBreakMode = .byTruncatingTail
        statusLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
        toolbar.addArrangedSubview(newButton)
        toolbar.addArrangedSubview(managerButton)
        toolbar.addArrangedSubview(blogButton)
        toolbar.addArrangedSubview(checkButton)
        toolbar.addArrangedSubview(folderButton)
        toolbar.addArrangedSubview(statusLabel)

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(toolbar)
        container.addSubview(webView)

        NSLayoutConstraint.activate([
            toolbar.topAnchor.constraint(equalTo: container.topAnchor),
            toolbar.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 54),
            webView.topAnchor.constraint(equalTo: toolbar.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func button(_ title: String, symbol: String, action: Selector) -> NSButton {
        let control = NSButton(title: title, target: self, action: action)
        control.bezelStyle = .rounded
        control.image = NSImage(systemSymbolName: symbol, accessibilityDescription: title)
        control.imagePosition = .imageLeading
        control.toolTip = title
        return control
    }

    private func makeMenu() {
        let menu = NSMenu()
        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "退出 Haibin Blog Publisher", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        menu.addItem(appItem)

        let fileItem = NSMenuItem()
        let fileMenu = NSMenu(title: "文章")
        fileMenu.addItem(withTitle: "新建文章", action: #selector(newPost), keyEquivalent: "n")
        fileMenu.addItem(withTitle: "文章管理", action: #selector(openManager), keyEquivalent: "m")
        fileMenu.addItem(withTitle: "查看博客", action: #selector(openBlog), keyEquivalent: "b")
        fileMenu.addItem(withTitle: "检测发布", action: #selector(checkPublish), keyEquivalent: "r")
        fileItem.submenu = fileMenu
        menu.addItem(fileItem)
        NSApp.mainMenu = menu
    }

    private func isBlogRepository(_ url: URL) -> Bool {
        let file = url.appendingPathComponent("tools/blog-publisher/server.mjs").path
        let posts = url.appendingPathComponent("src/content/posts").path
        return FileManager.default.fileExists(atPath: file) && FileManager.default.fileExists(atPath: posts)
    }

    private func configuredRepository() -> URL? {
        let paths = [
            UserDefaults.standard.string(forKey: "BlogRepository"),
            Bundle.main.object(forInfoDictionaryKey: "BlogRoot") as? String
        ]
        for path in paths.compactMap({ $0 }) {
            let url = URL(fileURLWithPath: path).resolvingSymlinksInPath()
            if isBlogRepository(url) { return url }
        }
        return nil
    }

    @objc private func chooseRepository(_ sender: Any?) {
        let panel = NSOpenPanel()
        panel.message = "选择包含 src/content/posts 的博客仓库"
        panel.prompt = "选择博客目录"
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.directoryURL = repository
        guard panel.runModal() == .OK, let selected = panel.url else { return }
        let root = selected.resolvingSymlinksInPath()
        guard isBlogRepository(root) else {
            let alert = NSAlert()
            alert.messageText = "这不是博客仓库"
            alert.informativeText = "请选择包含 tools/blog-publisher/server.mjs 和 src/content/posts 的目录。"
            alert.runModal()
            return
        }
        if serverProcess?.isRunning == true { serverProcess?.terminate() }
        serverProcess = nil
        activePort = nil
        repository = root
        UserDefaults.standard.set(root.path, forKey: "BlogRepository")
        hasLoadedWriter = false
        connect()
    }

    private func nodeExecutable() -> String? {
        let configured = Bundle.main.object(forInfoDictionaryKey: "NodeExecutable") as? String
        let candidates = [configured, "/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node"]
        return candidates.compactMap { $0 }.first { FileManager.default.isExecutableFile(atPath: $0) }
    }

    private func probe(port: Int) -> PublisherConfig? {
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/config") else { return nil }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        request.timeoutInterval = 1
        let semaphore = DispatchSemaphore(value: 0)
        var config: PublisherConfig?
        URLSession.shared.dataTask(with: request) { data, response, _ in
            if let data, (response as? HTTPURLResponse)?.statusCode == 200 {
                config = try? JSONDecoder().decode(PublisherConfig.self, from: data)
            }
            semaphore.signal()
        }.resume()
        _ = semaphore.wait(timeout: .now() + 2)
        return config
    }

    private func matches(_ config: PublisherConfig?, root: URL) -> Bool {
        guard let config else { return false }
        return config.publisherUiVersion == 2 &&
            URL(fileURLWithPath: config.root).resolvingSymlinksInPath().path == root.path
    }

    private func findOrStartServer(root: URL) -> ConnectionResult {
        for port in 4322...4332 where matches(probe(port: port), root: root) {
            return .ready(port: port, process: nil)
        }
        guard let node = nodeExecutable() else {
            return .failed("找不到 Node.js。请安装 Node.js 后重试。")
        }
        for port in 4322...4332 {
            let process = Process()
            process.executableURL = URL(fileURLWithPath: node)
            process.arguments = [root.appendingPathComponent("tools/blog-publisher/server.mjs").path]
            process.currentDirectoryURL = root
            var environment = ProcessInfo.processInfo.environment
            environment["PUBLISHER_PORT"] = String(port)
            process.environment = environment
            process.standardOutput = FileHandle.nullDevice
            process.standardError = FileHandle.nullDevice
            do { try process.run() }
            catch { return .failed("无法启动本地服务：\(error.localizedDescription)") }
            for _ in 0..<30 {
                if matches(probe(port: port), root: root) { return .ready(port: port, process: process) }
                if !process.isRunning { break }
                Thread.sleep(forTimeInterval: 0.15)
            }
            if process.isRunning { process.terminate() }
        }
        return .failed("本地服务启动失败。请检查博客仓库的 Node.js 依赖是否已安装。")
    }

    private func connect() {
        guard let root = repository, !isConnecting else { return }
        isConnecting = true
        statusLabel.stringValue = "正在连接本地服务…"
        serviceQueue.async { [weak self] in
            guard let self else { return }
            let result = self.findOrStartServer(root: root)
            DispatchQueue.main.async {
                self.isConnecting = false
                switch result {
                case let .ready(port, process):
                    self.activePort = port
                    if let process { self.serverProcess = process }
                    self.statusLabel.stringValue = "本地服务已连接 · \(port)"
                    if !self.hasLoadedWriter {
                        self.hasLoadedWriter = true
                        self.load(path: "/")
                    }
                case let .failed(message):
                    self.statusLabel.stringValue = message
                }
            }
        }
    }

    private func checkHealth() {
        guard let port = activePort, let root = repository, !isConnecting else {
            if activePort == nil { connect() }
            return
        }
        serviceQueue.async { [weak self] in
            guard let self else { return }
            let healthy = self.matches(self.probe(port: port), root: root)
            DispatchQueue.main.async {
                if !healthy {
                    self.activePort = nil
                    self.statusLabel.stringValue = "连接中断，正在恢复…"
                    self.connect()
                }
            }
        }
    }

    private func load(path: String) {
        guard let port = activePort, let url = URL(string: "http://127.0.0.1:\(port)\(path)") else { return }
        webView.load(URLRequest(url: url))
    }

    @objc private func newPost() {
        guard activePort != nil else { connect(); return }
        if webView.url?.path == "/" {
            webView.evaluateJavaScript("window.blogPublisherStartNewPost?.()")
        } else {
            load(path: "/")
        }
    }

    @objc private func openManager() {
        openLocalPage(path: "/manager")
    }

    @objc private func openBlog() {
        openLocalPage(path: "/blog.html")
    }

    private func openLocalPage(path: String) {
        guard activePort != nil else { connect(); return }
        webView.evaluateJavaScript("Boolean(window.blogPublisherHasUnsavedChanges?.())") { [weak self] result, _ in
            guard let self else { return }
            if result as? Bool == true {
                let alert = NSAlert()
                alert.messageText = "当前编辑内容尚未保存"
                alert.informativeText = "离开编辑器前，请确认内容已经保存或已自动保存在本地草稿中。"
                alert.addButton(withTitle: "继续离开编辑器")
                alert.addButton(withTitle: "留在编辑器")
                if alert.runModal() != .alertFirstButtonReturn { return }
            }
            self.load(path: path)
        }
    }

    @objc private func checkPublish() {
        webView.evaluateJavaScript("document.querySelector('#check-push')?.click()")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.host == "127.0.0.1" && url.port == activePort {
            decisionHandler(.allow)
        } else if navigationAction.targetFrame?.isMainFrame == false &&
                    url.scheme == "https" && url.host == "www.haibinlaiblog.top" {
            decisionHandler(.allow)
        } else if url.scheme == "about" {
            decisionHandler(.allow)
        } else if url.scheme == "http" || url.scheme == "https" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
        } else {
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url,
           url.scheme == "http" || url.scheme == "https" {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "确定")
        alert.addButton(withTitle: "取消")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.runModal()
        completionHandler()
    }
}

let app = NSApplication.shared
let delegate = BlogPublisherApp()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
