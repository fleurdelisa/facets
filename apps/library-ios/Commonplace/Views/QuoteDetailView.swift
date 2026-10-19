import SwiftUI

struct QuoteDetailView: View {
    @Environment(QuoteStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State var quote: Quote
    @State private var related: [RelatedQuote] = []
    @State private var isEditing = false
    @State private var confirmingDelete = false
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("“\(quote.text)”")
                        .font(.system(.title2, design: .serif))
                        .textSelection(.enabled)
                    Label(quote.attribution.isEmpty ? quote.sourceType.label : quote.attribution,
                          systemImage: quote.sourceType.symbol)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    if !quote.tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack { ForEach(quote.tags, id: \.self) { Chip(text: "#\($0)") } }
                        }
                    }
                }
                .padding(.leading, 14)
                .overlay(alignment: .leading) { Rectangle().fill(Color.accent).frame(width: 3) }

                VStack(alignment: .leading, spacing: 8) {
                    Text("WHY I LOVE IT").font(.caption.weight(.semibold)).kerning(1.5).foregroundStyle(Color.accent)
                    Text(quote.notes.isEmpty ? "No notes yet — tap Edit to add why it matters to you." : quote.notes)
                        .foregroundStyle(quote.notes.isEmpty ? .secondary : .primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Added \(quote.createdAt.formatted(date: .long, time: .shortened))")
                    if quote.wasEdited {
                        Text("Edited \(quote.updatedAt.formatted(date: .long, time: .shortened))")
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)

                if let error {
                    Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.red).font(.footnote)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Related quotes").font(.system(.title3, design: .serif))
                    if related.isEmpty {
                        Text("Nothing related yet. Suggestions come from shared tags, the same author or source, and similar wording.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(related) { item in
                        NavigationLink(value: item.quote) {
                            QuoteRow(quote: item.quote, reasons: item.reasons)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(12)
                                .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                ShareLink(item: "“\(quote.text)” — \(quote.attribution)")
                Menu("More", systemImage: "ellipsis.circle") {
                    Button("Edit", systemImage: "pencil") { isEditing = true }
                    Button("Delete", systemImage: "trash", role: .destructive) { confirmingDelete = true }
                }
            }
        }
        .confirmationDialog("Delete this quote?", isPresented: $confirmingDelete, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                Task {
                    do {
                        try await store.delete(quote)
                        dismiss()
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
            }
        }
        .sheet(isPresented: $isEditing) {
            QuoteFormView(quote: quote) { saved in
                quote = saved
                Task { await loadRelated() }
            }
        }
        .task(id: quote.id) { await loadRelated() }
    }

    private func loadRelated() async {
        do {
            related = try await store.client.related(to: quote.id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
