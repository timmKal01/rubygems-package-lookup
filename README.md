# RubyGems Package Lookup

Look up current version, total downloads, license, homepage, and
runtime dependencies for any RubyGems package, via the official
[rubygems.org API](https://guides.rubygems.org/rubygems-org-api/).

Built for DevOps and tooling teams tracking Ruby dependency health —
checking a gem's latest version, whether it's been yanked, or how
widely adopted it is — without checking rubygems.org by hand.

## Input

```json
{
  "gemNames": ["rails", "rspec", "nokogiri"]
}
```

| Field | Type | Description |
|---|---|---|
| `gemNames` | array of strings | One or more RubyGems package names to look up. Default `["rails"]`. |

## Output

One record per requested gem:

```json
{
  "gemName": "rails",
  "found": true,
  "latestVersion": "8.1.3.1",
  "latestVersionReleasedAt": "2026-07-29T15:02:41.060Z",
  "yanked": false,
  "totalDownloads": 778125297,
  "latestVersionDownloads": 3144551,
  "licenses": ["MIT"],
  "authors": "David Heinemeier Hansson",
  "homepageUrl": "https://rubyonrails.org",
  "sourceCodeUrl": "https://github.com/rails/rails/tree/v8.1.3.1",
  "documentationUrl": null,
  "runtimeDependencies": [
    { "name": "actionpack", "requirements": "= 8.1.3.1" }
  ]
}
```

An unrecognized gem name returns `{ "gemName": "...", "found": false }`
rather than failing the whole run.

Note: `totalDownloads` is a cumulative all-time count — rubygems.org's
public API doesn't expose a daily/period download-history endpoint
the way npm and PyPI's stats APIs do, so this actor is a snapshot
lookup rather than a trend tracker.

## How it works

Direct calls to the official `rubygems.org/api/v1/gems` endpoint — no
proxy, no key, no scraping.

## Pricing note

Billed per **lookup** (one run) at a flat rate, regardless of how many
gem names are requested.

## Related products

- [NPM Download Stats Tracker](https://github.com/timmKal01/npm-download-stats-tracker)
- [PyPI Download Stats Tracker](https://github.com/timmKal01/pypi-download-stats-tracker)
- [Homebrew Package Lookup](https://github.com/timmKal01/homebrew-package-lookup) — same snapshot-lookup shape, different ecosystem
