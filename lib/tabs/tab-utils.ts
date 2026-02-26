export type Tab =
	| { type: "home" | "new" | "trash" }
	| { type: "insight"; id: string }
	| { type: "tag"; id: string; name: string };

export function serializeTab(tab: Tab): string {
	switch (tab.type) {
		case "home":
		case "new":
		case "trash":
			return tab.type;
		case "insight":
			return `insight:${tab.id}`;
		case "tag":
			return `tag:${tab.id}:${tab.name}`;
	}
}

export function deserializeTab(str: string | null | undefined): Tab {
	if (!str) return { type: "home" };

	if (str === "home" || str === "new" || str === "trash") {
		return { type: str };
	}

	const [prefix, ...rest] = str.split(":");

	switch (prefix) {
		case "insight":
			return { type: "insight", id: rest.join(":") };
		case "tag":
			return { type: "tag", id: rest[0], name: rest.slice(1).join(":") };
		default:
			return { type: "home" };
	}
}
