import Foundation

enum SourceType: String, Codable, CaseIterable, Identifiable {
    case book, podcast, movie, tv, article, speech, song, other

    var id: String { rawValue }

    var label: String {
        switch self {
        case .tv: "TV"
        default: rawValue.capitalized
        }
    }

    var symbol: String {
        switch self {
        case .book: "book.closed"
        case .podcast: "mic"
        case .movie: "film"
        case .tv: "tv"
        case .article: "newspaper"
        case .speech: "person.wave.2"
        case .song: "music.note"
        case .other: "quote.opening"
        }
    }

    var locationHint: String {
        switch self {
        case .book: "p. 42 or ch. 3"
        case .podcast: "Episode 12 @ 1:23:45"
        case .movie: "1:02:10"
        case .tv: "S2E4 @ 18:30"
        case .song: "Verse 2"
        default: "Page, timestamp…"
        }
    }
}

struct Quote: Codable, Identifiable, Hashable {
    let id: String
    var text: String
    var sourceType: SourceType
    var sourceTitle: String
    var author: String
    var location: String
    var notes: String
    var tags: [String]
    let createdAt: Date
    let updatedAt: Date

    var wasEdited: Bool { updatedAt != createdAt }

    /// "Joseph Campbell, The Power of Myth · p. 12"
    var attribution: String {
        var line = [author, sourceTitle].filter { !$0.isEmpty }.joined(separator: ", ")
        if !location.isEmpty { line += line.isEmpty ? location : " · \(location)" }
        return line
    }
}

/// The editable fields, sent on create and update.
struct QuoteDraft: Codable, Equatable {
    var text = ""
    var sourceType: SourceType = .book
    var sourceTitle = ""
    var author = ""
    var location = ""
    var notes = ""
    var tags: [String] = []

    init() {}

    init(_ quote: Quote) {
        text = quote.text
        sourceType = quote.sourceType
        sourceTitle = quote.sourceTitle
        author = quote.author
        location = quote.location
        notes = quote.notes
        tags = quote.tags
    }
}

struct RelatedQuote: Codable, Identifiable, Hashable {
    let quote: Quote
    let score: Double
    let reasons: [String]

    var id: String { quote.id }
}
