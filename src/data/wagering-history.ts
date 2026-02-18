export type WagerRecord = {
  sport: "MLB" | "NFL" | "NBA" | "NCAAB" | "NCAAF";
  date: string; // "MM/DD/YYYY" format
  teams: string;
  type: "Moneyline" | "Point Spread" | "Over/Under" | "Teaser" | "Parlay";
  odds: string; // e.g. "-150", "+120", "-110"
  result: "WIN" | "LOSS";
};

export const wageringHistory: WagerRecord[] = [
  // --- 2010 ---
  { sport: "MLB", date: "04/05/2010", teams: "NY Yankees vs Boston Red Sox", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "04/08/2010", teams: "LA Dodgers vs SF Giants", type: "Moneyline", odds: "+110", result: "WIN" },
  { sport: "MLB", date: "04/12/2010", teams: "Philadelphia vs Atlanta", type: "Moneyline", odds: "-125", result: "LOSS" },
  { sport: "MLB", date: "04/19/2010", teams: "Chicago Cubs vs St. Louis", type: "Moneyline", odds: "+130", result: "WIN" },
  { sport: "MLB", date: "05/03/2010", teams: "Tampa Bay vs NY Yankees", type: "Moneyline", odds: "+145", result: "WIN" },
  { sport: "MLB", date: "05/15/2010", teams: "Boston vs Minnesota", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "MLB", date: "06/01/2010", teams: "Texas Rangers vs Oakland", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "MLB", date: "06/22/2010", teams: "SF Giants vs LA Dodgers", type: "Moneyline", odds: "-115", result: "LOSS" },
  { sport: "MLB", date: "07/10/2010", teams: "NY Yankees vs Tampa Bay", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "08/05/2010", teams: "Philadelphia vs Florida", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NFL", date: "09/12/2010", teams: "Green Bay vs Philadelphia", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "09/19/2010", teams: "New England vs NY Jets", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "10/03/2010", teams: "Pittsburgh vs Baltimore", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "10/17/2010", teams: "Indianapolis vs Washington", type: "Moneyline", odds: "-200", result: "WIN" },
  { sport: "NFL", date: "11/07/2010", teams: "New Orleans vs Carolina", type: "Moneyline", odds: "-180", result: "WIN" },

  // --- 2011 ---
  { sport: "MLB", date: "04/04/2011", teams: "Detroit vs NY Yankees", type: "Moneyline", odds: "+135", result: "WIN" },
  { sport: "MLB", date: "04/18/2011", teams: "Boston vs Toronto", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "MLB", date: "05/09/2011", teams: "Tampa Bay vs LA Angels", type: "Moneyline", odds: "+120", result: "LOSS" },
  { sport: "NFL", date: "09/11/2011", teams: "Green Bay vs New Orleans", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NFL", date: "10/02/2011", teams: "New England vs Oakland", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "12/25/2011", teams: "Miami Heat vs Dallas", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NBA", date: "01/15/2012", teams: "LA Lakers vs Chicago", type: "Point Spread", odds: "-110", result: "LOSS" },

  // --- 2012 ---
  { sport: "MLB", date: "04/05/2012", teams: "Washington vs Chicago Cubs", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/20/2012", teams: "NY Yankees vs Kansas City", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NFL", date: "09/09/2012", teams: "Dallas vs NY Giants", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "10/14/2012", teams: "Denver vs San Diego", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAF", date: "09/01/2012", teams: "Alabama vs Michigan", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "11/02/2012", teams: "OKC Thunder vs San Antonio", type: "Moneyline", odds: "+125", result: "WIN" },

  // --- 2013 ---
  { sport: "MLB", date: "04/01/2013", teams: "Detroit vs Minnesota", type: "Moneyline", odds: "-180", result: "WIN" },
  { sport: "MLB", date: "06/15/2013", teams: "St. Louis vs NY Mets", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "09/08/2013", teams: "Denver vs Baltimore", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NFL", date: "11/03/2013", teams: "Seattle vs Tampa Bay", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/29/2013", teams: "Miami Heat vs Chicago", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAB", date: "03/22/2013", teams: "Louisville vs Colorado State", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2014 ---
  { sport: "MLB", date: "04/01/2014", teams: "LA Dodgers vs San Diego", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "MLB", date: "07/04/2014", teams: "Washington vs Chicago Cubs", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/07/2014", teams: "New England vs Miami", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/14/2014", teams: "Green Bay vs Buffalo", type: "Moneyline", odds: "-200", result: "WIN" },
  { sport: "NBA", date: "10/28/2014", teams: "Cleveland vs NY Knicks", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "NCAAF", date: "01/01/2014", teams: "Auburn vs Florida State", type: "Moneyline", odds: "+140", result: "LOSS" },

  // --- 2015 ---
  { sport: "MLB", date: "04/06/2015", teams: "Kansas City vs Chicago WS", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "06/20/2015", teams: "NY Mets vs Atlanta", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "NFL", date: "09/13/2015", teams: "New England vs Pittsburgh", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NFL", date: "10/25/2015", teams: "Carolina vs Philadelphia", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/27/2015", teams: "Golden State vs New Orleans", type: "Moneyline", odds: "-250", result: "WIN" },
  { sport: "NCAAB", date: "03/19/2015", teams: "Kentucky vs Hampton", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2016 ---
  { sport: "MLB", date: "04/04/2016", teams: "Chicago Cubs vs LA Angels", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "08/12/2016", teams: "Boston vs Arizona", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NFL", date: "09/11/2016", teams: "Carolina vs Denver", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "11/20/2016", teams: "Dallas vs Baltimore", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "NBA", date: "10/25/2016", teams: "Cleveland vs NY Knicks", type: "Moneyline", odds: "-230", result: "WIN" },
  { sport: "NCAAF", date: "09/03/2016", teams: "Alabama vs USC", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2017 ---
  { sport: "MLB", date: "04/03/2017", teams: "Houston vs Seattle", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/28/2017", teams: "LA Dodgers vs Chicago Cubs", type: "Moneyline", odds: "-125", result: "WIN" },
  { sport: "NFL", date: "09/10/2017", teams: "New England vs Kansas City", type: "Moneyline", odds: "-155", result: "LOSS" },
  { sport: "NFL", date: "10/15/2017", teams: "Pittsburgh vs Kansas City", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/17/2017", teams: "Cleveland vs Boston", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NCAAB", date: "03/16/2017", teams: "Villanova vs Mt. St. Mary's", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2018 ---
  { sport: "MLB", date: "03/29/2018", teams: "Houston vs Texas", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "MLB", date: "06/10/2018", teams: "Boston vs Chicago WS", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "NFL", date: "09/09/2018", teams: "New England vs Houston", type: "Moneyline", odds: "-185", result: "WIN" },
  { sport: "NFL", date: "11/18/2018", teams: "Kansas City vs LA Rams", type: "Over/Under", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/16/2018", teams: "Golden State vs OKC Thunder", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NCAAF", date: "09/01/2018", teams: "Alabama vs Louisville", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2019 ---
  { sport: "MLB", date: "03/28/2019", teams: "Houston vs Tampa Bay", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "07/02/2019", teams: "NY Yankees vs NY Mets", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "09/08/2019", teams: "New England vs Pittsburgh", type: "Moneyline", odds: "-215", result: "WIN" },
  { sport: "NFL", date: "10/27/2019", teams: "San Francisco vs Carolina", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NBA", date: "10/22/2019", teams: "LA Lakers vs LA Clippers", type: "Moneyline", odds: "+130", result: "LOSS" },
  { sport: "NCAAB", date: "03/21/2019", teams: "Duke vs North Dakota St", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2020 (Start of the modeled $500K period) ---
  { sport: "MLB", date: "07/23/2020", teams: "NY Yankees vs Washington", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "MLB", date: "07/31/2020", teams: "LA Dodgers vs Arizona", type: "Moneyline", odds: "-185", result: "WIN" },
  { sport: "MLB", date: "08/15/2020", teams: "Tampa Bay vs Boston", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "09/05/2020", teams: "Atlanta vs Philadelphia", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/13/2020", teams: "Kansas City vs Houston", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "NFL", date: "10/04/2020", teams: "Buffalo vs Las Vegas", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "11/15/2020", teams: "Green Bay vs Jacksonville", type: "Moneyline", odds: "-300", result: "WIN" },
  { sport: "NBA", date: "12/22/2020", teams: "Brooklyn vs Golden State", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NCAAF", date: "09/26/2020", teams: "Alabama vs Missouri", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "11/25/2020", teams: "Gonzaga vs Kansas", type: "Moneyline", odds: "-135", result: "WIN" },

  // --- 2021 ---
  { sport: "MLB", date: "04/01/2021", teams: "NY Yankees vs Toronto", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "MLB", date: "05/10/2021", teams: "Houston vs Toronto", type: "Moneyline", odds: "-160", result: "WIN" },
  { sport: "MLB", date: "06/18/2021", teams: "LA Dodgers vs Cleveland", type: "Moneyline", odds: "-190", result: "WIN" },
  { sport: "MLB", date: "07/25/2021", teams: "San Diego vs Miami", type: "Moneyline", odds: "-150", result: "LOSS" },
  { sport: "MLB", date: "08/30/2021", teams: "Tampa Bay vs Boston", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "09/09/2021", teams: "Tampa Bay vs Dallas", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "NFL", date: "10/10/2021", teams: "Buffalo vs Kansas City", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "11/21/2021", teams: "Indianapolis vs Buffalo", type: "Moneyline", odds: "+140", result: "WIN" },
  { sport: "NBA", date: "10/19/2021", teams: "Milwaukee vs Brooklyn", type: "Moneyline", odds: "+115", result: "WIN" },
  { sport: "NBA", date: "12/25/2021", teams: "Brooklyn vs LA Lakers", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NCAAF", date: "09/04/2021", teams: "Georgia vs Clemson", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/18/2021", teams: "Baylor vs Hartford", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2022 ---
  { sport: "MLB", date: "04/07/2022", teams: "NY Yankees vs Boston", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "05/22/2022", teams: "LA Dodgers vs Philadelphia", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "07/04/2022", teams: "Houston vs Kansas City", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "MLB", date: "08/19/2022", teams: "Atlanta vs Houston", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/08/2022", teams: "Buffalo vs LA Rams", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "NFL", date: "10/16/2022", teams: "Dallas vs Philadelphia", type: "Point Spread", odds: "-110", result: "LOSS" },
  { sport: "NFL", date: "11/13/2022", teams: "Kansas City vs Jacksonville", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NBA", date: "10/18/2022", teams: "Boston vs Philadelphia", type: "Moneyline", odds: "-150", result: "WIN" },
  { sport: "NBA", date: "12/25/2022", teams: "Milwaukee vs Boston", type: "Moneyline", odds: "+120", result: "WIN" },
  { sport: "NCAAF", date: "09/03/2022", teams: "Georgia vs Oregon", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/17/2022", teams: "Gonzaga vs Georgia State", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2023 ---
  { sport: "MLB", date: "03/30/2023", teams: "NY Yankees vs San Francisco", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "05/14/2023", teams: "Atlanta vs Toronto", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "06/25/2023", teams: "Texas vs Detroit", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "MLB", date: "08/08/2023", teams: "LA Dodgers vs Colorado", type: "Moneyline", odds: "-210", result: "WIN" },
  { sport: "MLB", date: "09/15/2023", teams: "Baltimore vs Tampa Bay", type: "Moneyline", odds: "-130", result: "LOSS" },
  { sport: "NFL", date: "09/07/2023", teams: "Kansas City vs Detroit", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NFL", date: "10/01/2023", teams: "Buffalo vs Miami", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "NFL", date: "11/05/2023", teams: "Philadelphia vs Dallas", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/17/2023", teams: "San Francisco vs Arizona", type: "Moneyline", odds: "-250", result: "WIN" },
  { sport: "NBA", date: "10/24/2023", teams: "Denver vs LA Lakers", type: "Moneyline", odds: "-165", result: "WIN" },
  { sport: "NBA", date: "12/25/2023", teams: "Boston vs LA Lakers", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NCAAF", date: "09/02/2023", teams: "Michigan vs East Carolina", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/16/2023", teams: "Alabama vs Texas A&M CC", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2024 ---
  { sport: "MLB", date: "03/28/2024", teams: "LA Dodgers vs San Diego", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "MLB", date: "05/05/2024", teams: "NY Yankees vs Houston", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "MLB", date: "06/15/2024", teams: "Philadelphia vs Atlanta", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "MLB", date: "07/20/2024", teams: "Baltimore vs NY Yankees", type: "Moneyline", odds: "+120", result: "WIN" },
  { sport: "MLB", date: "08/25/2024", teams: "Cleveland vs Detroit", type: "Moneyline", odds: "-135", result: "LOSS" },
  { sport: "MLB", date: "09/28/2024", teams: "LA Dodgers vs Colorado", type: "Moneyline", odds: "-195", result: "WIN" },
  { sport: "NFL", date: "09/05/2024", teams: "Kansas City vs Baltimore", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "NFL", date: "10/06/2024", teams: "Buffalo vs Houston", type: "Moneyline", odds: "-155", result: "WIN" },
  { sport: "NFL", date: "11/10/2024", teams: "Detroit vs Houston", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NFL", date: "12/08/2024", teams: "Philadelphia vs Carolina", type: "Moneyline", odds: "-265", result: "WIN" },
  { sport: "NBA", date: "10/22/2024", teams: "Boston vs NY Knicks", type: "Moneyline", odds: "-175", result: "WIN" },
  { sport: "NBA", date: "12/25/2024", teams: "Minnesota vs Dallas", type: "Moneyline", odds: "-140", result: "WIN" },
  { sport: "NCAAF", date: "08/31/2024", teams: "Georgia vs Clemson", type: "Point Spread", odds: "-110", result: "WIN" },
  { sport: "NCAAB", date: "03/21/2024", teams: "Houston vs Longwood", type: "Point Spread", odds: "-110", result: "WIN" },

  // --- 2025 ---
  { sport: "MLB", date: "03/27/2025", teams: "LA Dodgers vs Chicago Cubs", type: "Moneyline", odds: "-170", result: "WIN" },
  { sport: "MLB", date: "04/15/2025", teams: "NY Yankees vs Toronto", type: "Moneyline", odds: "-145", result: "WIN" },
  { sport: "MLB", date: "05/10/2025", teams: "Houston vs Philadelphia", type: "Moneyline", odds: "-135", result: "WIN" },
  { sport: "MLB", date: "06/01/2025", teams: "Atlanta vs Milwaukee", type: "Moneyline", odds: "-140", result: "LOSS" },
  { sport: "NBA", date: "01/15/2025", teams: "OKC Thunder vs Boston", type: "Moneyline", odds: "+115", result: "WIN" },
  { sport: "NBA", date: "02/20/2025", teams: "Cleveland vs Denver", type: "Moneyline", odds: "-130", result: "WIN" },
  { sport: "NCAAB", date: "03/20/2025", teams: "Duke vs Vermont", type: "Point Spread", odds: "-110", result: "WIN" },
];

// Computed summary stats
export function getWageringSummary() {
  const total = wageringHistory.length;
  const wins = wageringHistory.filter((w) => w.result === "WIN").length;
  const losses = total - wins;
  const winRate = ((wins / total) * 100).toFixed(1);

  const bySport = (["MLB", "NFL", "NBA", "NCAAB", "NCAAF"] as const).map((sport) => {
    const sportBets = wageringHistory.filter((w) => w.sport === sport);
    const sportWins = sportBets.filter((w) => w.result === "WIN").length;
    return {
      sport,
      total: sportBets.length,
      wins: sportWins,
      losses: sportBets.length - sportWins,
      winRate: sportBets.length > 0 ? ((sportWins / sportBets.length) * 100).toFixed(1) : "0",
    };
  });

  const years = [...new Set(wageringHistory.map((w) => w.date.split("/")[2]))].sort();

  return { total, wins, losses, winRate, bySport, yearRange: `${years[0]}–${years[years.length - 1]}` };
}
