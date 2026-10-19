import SwiftUI

struct QuoteListView: View {
    @Environment(QuoteStore.self) private var store
    @State private var search = ""
    @State private var typeFilter: SourceType?
    @State private var tagFilter: String?
    @State private var isAdding = false
    @State private var showingSettings = false

    private var filtered: [Quote] {
        store.quotes.filter { quote in
            (typeFilter == nil || quote.sourceType == typeFilter)
                && (tagFilter == nil || quote.tags.contains(tagFilter!))
                && (search.isEmpty || [quote.text, quote.notes, quote.author, quote.sourceTitle]
                    .contains { $0.localizedCaseInsensitiveContains(search) })
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if !store.isConfigured {
                    ContentUnavailableView {
                        Label("Connect to your library", systemImage: "server.rack")
                    } description: {
                        Text("Enter the address of your Commonplace web app and your access token.")
                    } actions: {
                        Button("Open Settings") { showingSettings = true }.buttonStyle(.borderedProminent)
                    }
                } else if store.quotes.isEmpty && !store.isLoading {
                    ContentUnavailableView {
                        Label("No quotes yet", systemImage: "quote.opening")
                    } description: {
                        Text(store.error ?? "Save the lines that stay with you.")
                    } actions: {
                        Button("Add a quote") { isAdding = true }.buttonStyle(.borderedProminent)
                    }
                } else {
                    list
                }
            }
            .navigationTitle("Commonplace")
            .navigationDestination(for: Quote.self) { QuoteDetailView(quote: $0) }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Settings", systemImage: "gearshape") { showingSettings = true }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button("New quote", systemImage: "plus") { isAdding = true }
                        .disabled(!store.isConfigured)
                }
            }
            .sheet(isPresented: $isAdding) { QuoteFormView(quote: nil) }
            .sheet(isPresented: $showingSettings, onDismiss: { Task { await store.refresh() } }) {
                SettingsView()
            }
            .task { await store.refresh() }
        }
    }

    private var list: some View {
        List {
            if let message = store.error {
                Label(message, systemImage: "exclamationmark.triangle").foregroundStyle(.red)
            }
            filters
            ForEach(filtered) { quote in
                NavigationLink(value: quote) { QuoteRow(quote: quote) }
            }
            .onDelete { offsets in
                let doomed = offsets.map { filtered[$0] }
                Task {
                    for quote in doomed {
                        do { try await store.delete(quote) } catch { store.error = error.localizedDescription }
                    }
                }
            }
        }
        .listStyle(.plain)
        .searchable(text: $search, prompt: "Quotes, notes, authors, titles")
        .refreshable { await store.refresh() }
        .overlay {
            if filtered.isEmpty && !store.quotes.isEmpty {
                ContentUnavailableView.search
            }
        }
    }

    private var filters: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                Menu {
                    Button("All types") { typeFilter = nil }
                    ForEach(SourceType.allCases) { type in
                        Button(type.label, systemImage: type.symbol) { typeFilter = type }
                    }
                } label: {
                    Chip(text: typeFilter?.label ?? "All types", active: typeFilter != nil, systemImage: "line.3.horizontal.decrease")
                }
                ForEach(store.allTags, id: \.self) { tag in
                    Button {
                        tagFilter = tagFilter == tag ? nil : tag
                    } label: {
                        Chip(text: "#\(tag)", active: tagFilter == tag)
                    }
                }
            }
            .buttonStyle(.plain)
        }
        .listRowSeparator(.hidden)
    }
}

struct QuoteRow: View {
    let quote: Quote
    var reasons: [String] = []

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("“\(quote.text)”")
                .font(.system(.body, design: .serif))
                .lineLimit(4)
            HStack(spacing: 6) {
                Image(systemName: quote.sourceType.symbol)
                Text(quote.attribution.isEmpty ? quote.sourceType.label : quote.attribution)
                    .lineLimit(1)
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            if reasons.isEmpty {
                Text("Added \(quote.createdAt.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            } else {
                Text(reasons.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(Color.accent)
            }
        }
        .padding(.vertical, 4)
    }
}

struct Chip: View {
    let text: String
    var active = false
    var systemImage: String?

    var body: some View {
        HStack(spacing: 4) {
            if let systemImage { Image(systemName: systemImage) }
            Text(text)
        }
        .font(.subheadline)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(active ? Color.accent : Color.secondary.opacity(0.12), in: Capsule())
        .foregroundStyle(active ? Color.white : Color.primary)
    }
}
