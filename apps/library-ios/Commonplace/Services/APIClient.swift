import Foundation

enum APIError: LocalizedError {
    case notConfigured
    case unauthorized
    case notFound
    case server(status: Int, message: String?)

    var errorDescription: String? {
        switch self {
        case .notConfigured: "Add your server address in Settings."
        case .unauthorized: "Your access token was rejected. Check it in Settings."
        case .notFound: "That quote no longer exists."
        case let .server(status, message): message ?? "Server error (\(status))."
        }
    }
}

/// Talks to the Commonplace web app's REST API (`/api/quotes`).
struct APIClient {
    var baseURL: URL?
    var token: String

    private static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        decoder.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            guard let date = withFraction.date(from: raw) ?? plain.date(from: raw) else {
                throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad date \(raw)"))
            }
            return date
        }
        return decoder
    }()

    private struct QuoteEnvelope: Decodable { let quote: Quote }
    private struct OptionalQuoteEnvelope: Decodable { let quote: Quote? }
    private struct ListEnvelope: Decodable { let quotes: [Quote] }
    private struct RelatedEnvelope: Decodable { let related: [RelatedQuote] }
    private struct ErrorEnvelope: Decodable { let error: String }

    func list(search: String = "", tag: String? = nil, type: SourceType? = nil) async throws -> [Quote] {
        var query: [URLQueryItem] = []
        if !search.isEmpty { query.append(.init(name: "q", value: search)) }
        if let tag { query.append(.init(name: "tag", value: tag)) }
        if let type { query.append(.init(name: "type", value: type.rawValue)) }
        let data = try await send("GET", "api/quotes", query: query)
        return try Self.decoder.decode(ListEnvelope.self, from: data).quotes
    }

    func get(_ id: String) async throws -> Quote {
        try Self.decoder.decode(QuoteEnvelope.self, from: await send("GET", "api/quotes/\(id)")).quote
    }

    func create(_ draft: QuoteDraft) async throws -> Quote {
        try Self.decoder.decode(QuoteEnvelope.self, from: await send("POST", "api/quotes", body: draft)).quote
    }

    func update(_ id: String, with draft: QuoteDraft) async throws -> Quote {
        try Self.decoder.decode(QuoteEnvelope.self, from: await send("PATCH", "api/quotes/\(id)", body: draft)).quote
    }

    func delete(_ id: String) async throws {
        _ = try await send("DELETE", "api/quotes/\(id)")
    }

    func related(to id: String) async throws -> [RelatedQuote] {
        try Self.decoder.decode(RelatedEnvelope.self, from: await send("GET", "api/quotes/\(id)/related")).related
    }

    func quoteOfTheDay() async throws -> Quote? {
        try Self.decoder.decode(OptionalQuoteEnvelope.self, from: await send("GET", "api/quotes/random")).quote
    }

    private func send(
        _ method: String,
        _ path: String,
        query: [URLQueryItem] = [],
        body: (any Encodable)? = nil
    ) async throws -> Data {
        guard let baseURL else { throw APIError.notConfigured }
        var url = baseURL.appending(path: path)
        if !query.isEmpty { url.append(queryItems: query) }

        var request = URLRequest(url: url)
        request.httpMethod = method
        if !token.isEmpty { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        switch status {
        case 200..<300: return data
        case 401: throw APIError.unauthorized
        case 404: throw APIError.notFound
        default:
            let message = try? Self.decoder.decode(ErrorEnvelope.self, from: data).error
            throw APIError.server(status: status, message: message)
        }
    }
}
