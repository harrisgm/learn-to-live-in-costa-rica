import SwiftUI

struct ServerSettingsView: View {
    @Binding var serverBaseURL: String
    let onReconnect: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var draftURL = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Shared coach server") {
                    serverURLField

                    Text("Use the LAN IP of the machine running the Next.js server when connecting from iPhone or iPad.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("Tips") {
                    Text("Examples: `http://192.168.1.40:3000` on your home network, or `http://127.0.0.1:3000` when the native app and server are on the same Mac.")
                    Text("The app already allows local-network HTTP traffic so you do not need to force HTTPS for home-LAN use.")
                }
            }
            .navigationTitle("Server Settings")
            .task {
                draftURL = serverBaseURL
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Save") {
                        isSaving = true
                        serverBaseURL = draftURL
                        Task {
                            await onReconnect()
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(draftURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSaving)
                }
            }
        }
    }

    @ViewBuilder
    private var serverURLField: some View {
        #if os(iOS)
        TextField("http://192.168.1.40:3000", text: $draftURL)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        #else
        TextField("http://192.168.1.40:3000", text: $draftURL)
        #endif
    }
}
