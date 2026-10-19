import SwiftUI

@main
struct CommonplaceApp: App {
    @State private var store = QuoteStore()

    var body: some Scene {
        WindowGroup {
            QuoteListView()
                .environment(store)
                .tint(Color.accent)
        }
    }
}

extension Color {
    /// Matches the web app's terracotta accent.
    static let accent = Color(red: 0.60, green: 0.29, blue: 0.17)
}
