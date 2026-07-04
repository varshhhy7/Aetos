import { type NextRequest, NextResponse } from "next/server";

// Ported from OpenCut's app/api/sounds/search/route.ts. The auth rate-limit,
// typed-env, and zod validation were dropped with the rest of OpenCut's server
// side; the Freesound key is read from process.env and, if absent, the route
// returns an empty result set (200) so the editor's Sounds panel degrades
// instead of 404ing.

type FreesoundResult = {
	id: number;
	name: string;
	description: string;
	url: string;
	previews?: {
		"preview-hq-mp3"?: string;
		"preview-lq-mp3"?: string;
	};
	download?: string;
	duration: number;
	filesize: number;
	type: string;
	channels: number;
	bitrate: number;
	bitdepth: number;
	samplerate: number;
	username: string;
	tags: string[];
	license: string;
	created: string;
	num_downloads?: number;
	avg_rating?: number;
	num_ratings?: number;
};

type FreesoundResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: FreesoundResult[];
};

function clampInt(value: string | null, min: number, max: number, fallback: number) {
	const n = Number.parseInt(value ?? "", 10);
	if (Number.isNaN(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function clampFloat(value: string | null, min: number, max: number, fallback: number) {
	const n = Number.parseFloat(value ?? "");
	if (Number.isNaN(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function buildSortParameter({ query, sort }: { query?: string; sort: string }) {
	if (!query) return `${sort}_desc`;
	return sort === "score" ? "score" : `${sort}_desc`;
}

function applyEffectsFilters({
	params,
	min_rating,
	commercial_only,
}: {
	params: URLSearchParams;
	min_rating: number;
	commercial_only: boolean;
}) {
	params.append("filter", "duration:[* TO 30.0]");
	params.append("filter", `avg_rating:[${min_rating} TO *]`);

	if (commercial_only) {
		params.append(
			"filter",
			'license:("Attribution" OR "Creative Commons 0" OR "Attribution Noncommercial" OR "Attribution Commercial")',
		);
	}

	params.append(
		"filter",
		"tag:sound-effect OR tag:sfx OR tag:foley OR tag:ambient OR tag:nature OR tag:mechanical OR tag:electronic OR tag:impact OR tag:whoosh OR tag:explosion",
	);
}

function transformFreesoundResult(result: FreesoundResult) {
	return {
		id: result.id,
		name: result.name,
		description: result.description,
		url: result.url,
		previewUrl:
			result.previews?.["preview-hq-mp3"] ||
			result.previews?.["preview-lq-mp3"],
		downloadUrl: result.download,
		duration: result.duration,
		filesize: result.filesize,
		type: result.type,
		channels: result.channels,
		bitrate: result.bitrate,
		bitdepth: result.bitdepth,
		samplerate: result.samplerate,
		username: result.username,
		tags: result.tags,
		license: result.license,
		created: result.created,
		downloads: result.num_downloads || 0,
		rating: result.avg_rating || 0,
		ratingCount: result.num_ratings || 0,
	};
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		const query = searchParams.get("q") || undefined;
		const rawType = searchParams.get("type");
		const type =
			rawType === "songs" || rawType === "effects" ? rawType : undefined;
		const page = clampInt(searchParams.get("page"), 1, 1000, 1);
		const pageSize = clampInt(searchParams.get("page_size"), 1, 150, 20);
		const rawSort = searchParams.get("sort") ?? "downloads";
		const sort = ["downloads", "rating", "created", "score"].includes(rawSort)
			? rawSort
			: "downloads";
		const min_rating = clampFloat(searchParams.get("min_rating"), 0, 5, 3);
		const commercial_only = searchParams.get("commercial_only") !== "false";

		if (type === "songs") {
			return NextResponse.json(
				{
					error: "Songs are not available yet",
					message:
						"Song search functionality is coming soon. Try searching for sound effects instead.",
				},
				{ status: 501 },
			);
		}

		const apiKey = process.env.FREESOUND_API_KEY;
		if (!apiKey) {
			// No key configured: return an empty (but well-formed) result set so the
			// Sounds panel shows "no results" instead of throwing a fetch error.
			return NextResponse.json({
				count: 0,
				next: null,
				previous: null,
				results: [],
				query: query || "",
				type: type || "effects",
				page,
				pageSize,
				sort,
				minRating: min_rating,
			});
		}

		const baseUrl = "https://freesound.org/apiv2/search/text/";
		const sortParam = buildSortParameter({ query, sort });

		const params = new URLSearchParams({
			query: query || "",
			token: apiKey,
			page: page.toString(),
			page_size: pageSize.toString(),
			sort: sortParam,
			fields:
				"id,name,description,url,previews,download,duration,filesize,type,channels,bitrate,bitdepth,samplerate,username,tags,license,created,num_downloads,avg_rating,num_ratings",
		});

		const isEffectsSearch = type === "effects" || !type;
		if (isEffectsSearch) {
			applyEffectsFilters({ params, min_rating, commercial_only });
		}

		const response = await fetch(`${baseUrl}?${params.toString()}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Freesound API error:", response.status, errorText);
			return NextResponse.json(
				{ error: "Failed to search sounds" },
				{ status: response.status },
			);
		}

		const data = (await response.json()) as FreesoundResponse;
		const transformedResults = (data.results ?? []).map(transformFreesoundResult);

		return NextResponse.json({
			count: data.count ?? transformedResults.length,
			next: data.next ?? null,
			previous: data.previous ?? null,
			results: transformedResults,
			query: query || "",
			type: type || "effects",
			page,
			pageSize,
			sort,
			minRating: min_rating,
		});
	} catch (error) {
		console.error("Error searching sounds:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
