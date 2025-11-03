// src/github.ts
import axios from "axios";
import "dotenv/config";
import logger from "vico-logger";


const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
};

export async function getContributors(repo: string, retries = 3) {
    const owner = process.env.GITHUB_OWNER;
    const url = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;

    try {
        console.log("getContributors", repo);

        for (let attempt = 1; attempt <= retries; attempt++) {
            const res = await axios.get(url, { headers });

            if (res.status === 200 && Array.isArray(res.data)) {
                return res.data.map((c: any) => ({
                    username: c.author.login,
                    avatarUrl: c.author.avatar_url,
                    profileUrl: c.author.html_url,
                    totalCommits: c.total,
                    linesAdded: c.weeks.reduce((a: number, w: any) => a + w.a, 0),
                    linesDeleted: c.weeks.reduce((a: number, w: any) => a + w.d, 0),
                }));
            }

            if (res.status === 202) {
                console.log(`Stats for ${owner}/${repo} are not ready yet. Retrying (${attempt}/${retries})...`);
                await new Promise((r) => setTimeout(r, 5000)); // tunggu 5 detik
                continue;
            }

            if (res.status === 404) {
                console.log(`Repository ${owner}/${repo} not found or stats not available.`);
                return [];
            }

            console.log("Unexpected response:", res.status, res.data);
            return [];
        }

        console.log(`Stats for ${owner}/${repo} still not ready after ${retries} retries.`);
        return [];

    } catch (error) {
        logger.error("error fetching contributors", error);
        return [];
    }
}


// =================== FETCH REPOS ===================
export async function getRepos() {
    try {
        const owner = process.env.GITHUB_OWNER;
        console.log("getRepos", owner);


        // Fetch semua repos dengan pagination
        const allRepos: any[] = [];
        let page = 1;
        const perPage = 100; // maksimum 100 per page

        while (true) {
            const url = `https://api.github.com/orgs/${owner}/repos?per_page=${perPage}&page=${page}`;
            const res = await axios.get(url, { headers });

            if (res.data.length === 0) break; // tidak ada repo lagi
            allRepos.push(...res.data);
            page++;
        }

        const repos = allRepos.map((r: any) => ({
            owner: owner,
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            forks: r.forks_count,
            updatedAt: r.updated_at,
        }));

        console.log(`Fetched ${repos.length} repos from GitHub`);
        return repos;
    } catch (error) {
        logger.error("error fetching repo", error)
        return [];
    }
}
