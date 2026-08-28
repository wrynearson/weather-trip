import { useState } from "react";
import { Info, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useTripStore } from "@/store/trip-store";
import { useThemeStore, type Theme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "System theme", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
];

export function Header() {
  const { stops, units, setUnits, clearTrip } = useTripStore();
  const { theme, setTheme } = useThemeStore();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-[780px] px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full sm:flex-1">
            <h1 className="font-heading text-2xl font-medium">Weather Trip</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Forecasted and historical weather averages
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* °C/°F Toggle */}
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              <Button
                variant={units === "C" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setUnits("C")}
              >
                °C
              </Button>
              <Button
                variant={units === "F" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setUnits("F")}
              >
                °F
              </Button>
            </div>

            {/* Theme Toggle */}
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setTheme(value)}
                >
                  <Icon />
                  <span className="sr-only">{label}</span>
                </Button>
              ))}
            </div>

            {/* Clear Trip */}
            {stops.length > 0 && (
              <Popover open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 />
                  <span className="sr-only">Clear trip</span>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56">
                  <p className="text-sm">Clear this trip? This can&apos;t be undone.</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmClearOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        clearTrip();
                        setConfirmClearOpen(false);
                      }}
                    >
                      Clear trip
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* About Button */}
            <Dialog>
              <DialogTrigger>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full bg-card"
                >
                  <Info />
                  <span className="sr-only">About</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>About</DialogTitle>
                </DialogHeader>
                <DialogDescription render={<div className="space-y-2.5" />}>
                  <p>
                    Weather Trip helps you see forecasted and typical weather
                    across every stop on a trip at a glance.
                  </p>
                  <p>
                    Stops within 15 days use a forecast. Stops further out show
                    30-year historical averages for that date.
                  </p>
                  <p>
                    Weather icons represent the day's primary weather condition.
                    The top three trip and stop weather conditions are shown in
                    order of their frequency; hover an icon to see the % of days
                    it covers.
                  </p>
                  <p>
                    Weather data comes from{" "}
                    <a
                      href="https://open-meteo.com"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open-Meteo
                    </a>{" "}
                    (forecast and 30-year historical archive). Locations are
                    looked up via{" "}
                    <a
                      href="https://nominatim.openstreetmap.org"
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenStreetMap Nominatim
                    </a>
                    . Weather icons are from{" "}
                    <a
                      href="https://lucide.dev"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lucide
                    </a>
                    .
                  </p>
                  <p>Your trip is saved only in your browser.</p>
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
