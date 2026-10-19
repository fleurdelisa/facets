import SwiftUI

struct QuoteFormView: View {
    @Environment(QuoteStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    let quote: Quote?
    var onSave: (Quote) -> Void = { _ in }

    @State private var draft = QuoteDraft()
    @State private var tagText = ""
    @State private var isSaving = false
    @State private var error: String?

    private var canSave: Bool {
        !draft.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSaving
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Quote") {
                    TextField("The words that stopped you in your tracks…", text: $draft.text, axis: .vertical)
                        .font(.system(.body, design: .serif))
                        .lineLimit(3...10)
                }
                Section("Source") {
                    Picker("Type", selection: $draft.sourceType) {
                        ForEach(SourceType.allCases) { Label($0.label, systemImage: $0.symbol).tag($0) }
                    }
                    TextField("Title", text: $draft.sourceTitle)
                    TextField("Who said it", text: $draft.author)
                    TextField(draft.sourceType.locationHint, text: $draft.location)
                }
                Section("Why I love it") {
                    TextField("What it means to you…", text: $draft.notes, axis: .vertical)
                        .lineLimit(3...12)
                }
                Section {
                    TextField("courage, grief, craft", text: $tagText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Tags")
                } footer: {
                    Text("Comma-separated. Shared tags help surface related quotes.")
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle(quote == nil ? "New quote" : "Edit quote")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }.disabled(!canSave)
                }
            }
            .onAppear {
                if let quote {
                    draft = QuoteDraft(quote)
                    tagText = quote.tags.joined(separator: ", ")
                }
            }
            .interactiveDismissDisabled(isSaving)
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        draft.tags = tagText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
            .filter { !$0.isEmpty }
        do {
            let saved = try await store.save(draft, editing: quote?.id)
            onSave(saved)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
