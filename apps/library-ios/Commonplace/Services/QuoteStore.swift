import Foundation
import Observation

/// App-wide state: connection settings plus the loaded quotes.
@MainActor
@Observable
final class QuoteStore {
    var serverAddress: String {
        didSet { UserDefaults.standard.set(serverAddress, forKey: "serverAddress") }
    }
    var token: String {
        didSet { Keychain.write(token, for: "apiToken") }
    }

    private(set) var quotes: [Quote] = []
    private(set) var isLoading = false
    var error: String?

    init() {
        serverAddress = UserDefaults.standard.string(forKey: "serverAddress") ?? ""
        token = Keychain.read("apiToken")
    }

    var isConfigured: Bool { client.baseURL != nil }

    var client: APIClient {
        let trimmed = serverAddress.trimmingCharacters(in: .whitespaces)
        let withScheme = trimmed.contains("://") ? trimmed : "https://\(trimmed)"
        let url = trimmed.isEmpty ? nil : URL(string: withScheme)
        return APIClient(baseURL: url, token: token)
    }

    var allTags: [String] {
        Array(Set(quotes.flatMap(\.tags))).sorted()
    }

    func refresh() async {
        guard isConfigured else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            quotes = try await client.list()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    func save(_ draft: QuoteDraft, editing id: String?) async throws -> Quote {
        let saved: Quote
        if let id {
            saved = try await client.update(id, with: draft)
        } else {
            saved = try await client.create(draft)
        }
        if let index = quotes.firstIndex(where: { $0.id == saved.id }) {
            quotes[index] = saved
        } else {
            quotes.insert(saved, at: 0)
        }
        return saved
    }

    func delete(_ quote: Quote) async throws {
        try await client.delete(quote.id)
        quotes.removeAll { $0.id == quote.id }
    }
}
