export const tools = [
    {
        name: "getRepos",
        description: "Retrieve a list of repositories. The `getRepos` function provides basic information about each repository without any contribution data.",
        type: "function",
        function: {
            name: "getRepos",
        }
    },
    {
        name: "getContributors",
        description: "Gunakan fungsi ini setiap kali pengguna menanyakan siapa yang paling banyak berkontribusi, jumlah kontribusi, atau kontributor repositori tertentu. Fungsi ini menerima nama repo dan mengembalikan daftar kontributor beserta statistik kontribusinya.",
        type: "function",
        function: {
            name: "getContributors",
            parameters: {
                type: "object",
                properties: {
                    repo: {
                        type: "string",
                        description: "Nama repositori target. Harus sesuai dengan nama yang dikembalikan oleh 'getRepos'."
                    }
                },
                required: ["repo"]
            }
        }
    }

];