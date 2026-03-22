// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DeleguaInterfaceGraficaMacOSHost",
    platforms: [
        .macOS(.v12),
    ],
    targets: [
        .executableTarget(
            name: "DeleguaInterfaceGraficaMacOSHost",
            path: "Sources"
        ),
    ]
)
