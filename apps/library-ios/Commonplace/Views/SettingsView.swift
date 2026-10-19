import SwiftUI

struct SettingsView: View {
    @Environment(QuoteStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var status: String?

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Form {
                Section {
                    TextField("commonplace.example.com", text: $store.serverAddress)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Access token", text: $store.token)
                } header: {
                    Text("Server")
                } footer: {
                    Text("The address of your Commonplace web app and its FACETS_API_TOKEN. Use http://<your-mac>.local:3000 while developing.")
                }
                Section {
                    Button("Test connection") { Task { await test() } }
                    if let status { Text(status).font(.footnote).foregroundStyle(.secondary) }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
    }

    private func test() async {
        status = "Connecting…"
        do {
            let count = try await store.client.list().count
            status = "Connected — \(count) quote\(count == 1 ? "" : "s") in your library."
        } catch {
            status = error.localizedDescription
        }
    }
}
