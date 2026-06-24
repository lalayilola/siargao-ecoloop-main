import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: "Home",
        howItWorks: "How it works",
        features: "Features",
        about: "About",
        signIn: "Sign in",
        joinEcoLoop: "Join EcoLoop",
        myProfile: "My profile",
        openApp: "Open app",
        myRequests: "My requests",
        signOut: "Sign out",
        account: "Account"
      },
      // Profile
      profile: {
        myAccount: "My account",
        yourProfile: "Your EcoLoop profile",
        userProfile: "User profile",
        backToMyProfile: "Back to my profile",
        fullName: "Full name",
        phone: "Phone",
        barangay: "Barangay",
        address: "Address",
        saveChanges: "Save changes",
        saving: "Saving...",
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        enterCurrentPassword: "Enter current password",
        enterNewPassword: "Enter new password",
        confirmNewPassword: "Confirm new password",
        updatePassword: "Update Password",
        updating: "Updating...",
        message: "Message",
        savePhoto: "Save photo",
        uploading: "Uploading...",
        profilePictureUpdated: "Profile picture updated",
        fillAllPasswordFields: "Please fill in all password fields",
        passwordsDoNotMatch: "New passwords do not match",
        passwordMinLength: "New password must be at least 6 characters",
        passwordUpdated: "Password updated successfully",
        passwordUpdateFailed: "Failed to update password"
      },
      // General
      common: {
        selectLanguage: "Select Language",
        english: "English",
        tagalog: "Tagalog",
        cebuano: "Cebuano"
      },
      // Home Page
      home: {
        hero: {
          badge: "A circular economy for Siargao",
          title: "Turn food waste into island harvest.",
          subtitle: "EcoLoop Siargao connects farmers, restaurants, residents and LGUs so kitchen scraps become compost, feed and fresh produce — keeping the island green and the loop closed.",
          joinLoop: "Join the loop",
          seeHowItWorks: "See how it works",
          wasteCollected: "Waste collected",
          divertedFromLandfill: "Diverted from landfill",
          activeMembers: "Active members"
        },
        problem: {
          label: "The problem",
          title: "Siargao's food waste belongs in the soil — not the landfill.",
          description: "Tons of edible scraps and organic matter leave restaurants, resorts and homes every week. Meanwhile, local farmers spend on inputs they could grow themselves through composting. EcoLoop bridges the two ends — and rewards everyone in between.",
          point1: "Reduce environmental pollution and methane from landfills",
          point2: "Support local food production with low-cost compost",
          point3: "Strengthen barangay-level cooperation and barter culture",
          point4: "Plan ahead with future-supply and future-need announcements"
        },
        roles: {
          title: "Built for the whole community",
          subtitle: "Four roles, one shared loop. Pick how you want to participate.",
          farmer: "Local Farmers",
          farmerDesc: "Post crops, schedule harvests, request food waste for compost or feed.",
          restaurant: "Restaurants",
          restaurantDesc: "Offer daily food waste, promote menu items, barter meals for produce.",
          resident: "Residents",
          residentDesc: "Drop household scraps, join barter trades, buy local produce.",
          lgu: "LGU Admins",
          lguDesc: "Monitor diversion, verify users, publish announcements, generate reports."
        },
        features: {
          title: "Everything the loop needs",
          subtitle: "From posting scraps to tracking island-wide impact, EcoLoop bundles every tool the community needs in one place.",
          allFeatures: "All features",
          ecoFeed: "EcoFeed",
          ecoFeedDesc: "A social feed of available crops, waste and trades from your barangay.",
          marketplaces: "Marketplaces",
          marketplacesDesc: "Two markets — food waste and fresh produce — with photos, weight, price and location.",
          barter: "Barter & Trades",
          barterDesc: "Swap waste, produce and meals without cash. Track every trade end-to-end.",
          smartSearch: "Smart Search",
          smartSearchDesc: "Find by crop, user, barangay, restaurant or waste type — instantly.",
          maps: "Maps & Locations",
          mapsDesc: "See pickup points, nearby farms and food waste sources at a glance.",
          dashboard: "LGU Dashboard",
          dashboardDesc: "Track waste collected, diverted, active users and trade volume.",
          verified: "Verified Community",
          verifiedDesc: "LGU-verified accounts keep the loop safe and trustworthy."
        },
        cta: {
          title: "Ready to close the loop on your block?",
          subtitle: "Register your farm, kitchen or household and start trading today — no cash, just community.",
          getStarted: "Get started",
          browseEcoFeed: "Browse the EcoFeed"
        }
      },
      // About Page
      about: {
        hero: {
          eyebrow: "About",
          title: "A circular economy, designed for Siargao.",
          subtitle: "EcoLoop Siargao is a community platform that links the people who produce food waste with the people who can turn it into something useful — closing the loop on island sustainability."
        },
        mission: {
          title: "Our mission",
          description: "Siargao's beauty depends on what happens behind the scenes — how households manage scraps, how restaurants handle trimmings, how farmers fertilize their fields, and how LGUs steward collective resources. EcoLoop makes each of those decisions easier and more rewarding by connecting them in a single circular system."
        },
        whyItMatters: {
          title: "Why it matters",
          description: "Diverting organic waste from landfills reduces methane emissions, cuts pollution in our waterways, and creates inputs for local food production — strengthening island food security and lowering costs for farmers."
        },
        principles: {
          divert: "Divert",
          divertDesc: "Reroute organic waste away from landfills.",
          regenerate: "Regenerate",
          regenerateDesc: "Build soil and grow more food, locally.",
          connect: "Connect",
          connectDesc: "Make the community the platform.",
          sustain: "Sustain",
          sustainDesc: "Protect Siargao for the next generation."
        },
        loopSteps: {
          title: "The loop, in plain words",
          step1: "Restaurants and homes post available food waste.",
          step2: "Farmers request pickups for compost or animal feed.",
          step3: "Farmers offer harvests as sale, trade, or barter.",
          step4: "LGUs verify members and track island-wide impact."
        }
      },
      // Features Page
      features: {
        hero: {
          eyebrow: "Features",
          title: "Nine tools that close the loop.",
          subtitle: "EcoLoop bundles a social feed, two marketplaces, a trade engine and an LGU monitoring layer — all designed for Siargao life."
        },
        ecoFeed: "EcoFeed",
        ecoFeedDesc: "A community dashboard of crops, scraps and promotions from farmers, residents and restaurants — with photos, weight, price, location and dates.",
        userRegistration: "User Registration",
        userRegistrationDesc: "Join as a Farmer, Restaurant Owner, or Resident. LGUs verify accounts to keep the network trusted.",
        richProfiles: "Rich Profiles",
        richProfilesDesc: "Role-tailored profiles: farm plot + crop calendar, restaurant hours + collection schedule, household waste availability.",
        foodWasteMarketplace: "Food Waste Marketplace",
        foodWasteMarketplaceDesc: "Post available waste with quantity, pickup location, images and schedule. Farmers request collection in one tap.",
        produceMarketplace: "Produce Marketplace",
        produceMarketplaceDesc: "Fruits, vegetables, herbs and organic products with photos, weight, price, available quantity and harvest date.",
        barterTrades: "Barter & Trades",
        barterTradesDesc: "Cashless trade requests with approval, status tracking and a full trade history.",
        smartSearch: "Smart Search",
        smartSearchDesc: "Filter by crop, user, barangay, address, restaurant or waste type.",
        mapsLocations: "Maps & Locations",
        mapsLocationsDesc: "See user locations, pickup points, nearby food waste sources and nearby farms.",
        lguDashboard: "LGU Admin Dashboard",
        lguDashboardDesc: "Monitor waste collected, diversion rates, active users, successful trades and crop output — with monthly reports."
      },
      // Auth Page
      auth: {
        hero: {
          eyebrow: "EcoLoop Account",
          title: "Sign in or join the loop.",
          subtitle: "Members can post in the EcoFeed, list waste and produce, request trades, and track community impact."
        },
        signIn: "Sign in",
        createAccount: "Create account",
        continueWithGoogle: "Continue with Google",
        email: "Email",
        password: "Password",
        forgotPassword: "Forgot password?",
        signingIn: "Signing in…",
        fullName: "Full name",
        phone: "Phone",
        barangay: "Barangay",
        barangayPlaceholder: "e.g. General Luna",
        address: "Address (optional)",
        iAmA: "I am a…",
        farmer: "Farmer",
        restaurant: "Restaurant",
        resident: "Resident",
        lguAdmin: "LGU Admin (requires approval)",
        creatingAccount: "Creating account…",
        welcomeBack: "Welcome back!",
        accountCreated: "Account created! You're signed in.",
        lguAccountCreated: "LGU account created. An EcoLoop admin will review and approve access.",
        googleSignInFailed: "Google sign-in failed",
        invalidInput: "Invalid input",
        unableToConfirmEmail: "Unable to auto-confirm email"
      },
      // Contact Page
      contact: {
        hero: {
          eyebrow: "Contact",
          title: "Let's close the loop together.",
          subtitle: "LGU partnerships, barangay rollouts, media or just a question — we'd love to hear from you."
        },
        email: "Email",
        phone: "Phone",
        office: "Office",
        messageSent: "Message sent!",
        messageSentDesc: "We'll get back to you shortly. Salamat!",
        sendUsMessage: "Send us a message",
        name: "Name",
        subject: "Subject",
        message: "Message",
        sendMessage: "Send message",
        demoForm: "Demo form — no data is submitted."
      },
      // Reset Password Page
      resetPassword: {
        setNewPassword: "Set a new password",
        resetYourPassword: "Reset your password",
        newPassword: "New password",
        updatePassword: "Update password",
        email: "Email",
        sendResetLink: "Send reset link",
        passwordUpdated: "Password updated. You can now sign in.",
        checkInbox: "Check your inbox for the reset link."
      },
      // Feed Page
      feed: {
        hero: {
          eyebrow: "EcoFeed",
          title: "What's moving across the loop today.",
          subtitle: "Browse the latest posts from farmers, restaurants and residents in your barangay."
        },
        filters: {
          all: "All",
          farmers: "Farmers",
          restaurants: "Restaurants",
          residents: "Residents",
          lgu: "LGU"
        },
        postPlaceholder: "Share crops, waste or a need…",
        photo: "Photo",
        location: "Location",
        post: "Post",
        photoAttached: "✓ Photo attached",
        locationAdded: "✓ Location added",
        signInToPost: "Sign in to post, react and trade.",
        signInToPostButton: "Sign in to post",
        searchPlaceholder: "Search the feed",
        loadingFeed: "Loading feed...",
        noPosts: "No posts match your filters yet.",
        whosPosting: "Who's posting",
        trending: "Trending in Siargao",
        postPublished: "Post published to EcoFeed",
        unableToLoadFeed: "Unable to load EcoFeed",
        sessionNotAvailable: "Your session is not available or doesn't match. Please sign out and sign in again.",
        storageBucketNotFound: "Storage bucket not found. Create it in Supabase Storage or set VITE_SUPABASE_STORAGE_BUCKET.",
        storageUploadBlocked: "Could not upload image: storage upload blocked by row-level security. Ensure the signed-in user is authenticated and the Supabase storage bucket policy allows uploads.",
        couldNotUploadImage: "Could not upload image",
        publishBlocked: "Publish blocked by row-level security. Ensure you're signed in and the database RLS policies allow inserts for your user.",
        couldNotPublish: "Could not publish post"
      }
    }
  },
  tl: {
    translation: {
      // Navigation
      nav: {
        home: "Tahanan",
        howItWorks: "Paano ito gumagana",
        features: "Mga Tampok",
        about: "Tungkol sa",
        signIn: "Mag-sign in",
        joinEcoLoop: "Sumali sa EcoLoop",
        myProfile: "Ang aking profile",
        openApp: "Buksan ang app",
        myRequests: "Ang aking mga hiling",
        signOut: "Mag-sign out",
        account: "Account"
      },
      // Profile
      profile: {
        myAccount: "Ang aking account",
        yourProfile: "Ang iyong EcoLoop profile",
        userProfile: "Profile ng user",
        backToMyProfile: "Bumalik sa aking profile",
        fullName: "Buong pangalan",
        phone: "Telepono",
        barangay: "Barangay",
        address: "Address",
        saveChanges: "I-save ang mga pagbabago",
        saving: "Nagse-save...",
        changePassword: "Baguhin ang Password",
        currentPassword: "Kasalukuyang Password",
        newPassword: "Bagong Password",
        confirmPassword: "Kumpirmahin ang Bagong Password",
        enterCurrentPassword: "Ilagay ang kasalukuyang password",
        enterNewPassword: "Ilagay ang bagong password",
        confirmNewPassword: "Kumpirmahin ang bagong password",
        updatePassword: "I-update ang Password",
        updating: "Nag-uupdate...",
        message: "Mensahe",
        savePhoto: "I-save ang litrato",
        uploading: "Nag-a-upload...",
        profilePictureUpdated: "Na-update ang profile picture",
        fillAllPasswordFields: "Punan ang lahat ng password fields",
        passwordsDoNotMatch: "Hindi nagtugma ang mga bagong password",
        passwordMinLength: "Ang bagong password ay dapat na hindi bababa sa 6 characters",
        passwordUpdated: "Matagumpay na na-update ang password",
        passwordUpdateFailed: "Nabigo ang pag-update ng password"
      },
      // General
      common: {
        selectLanguage: "Pumili ng Wika",
        english: "English",
        tagalog: "Tagalog",
        cebuano: "Cebuano"
      },
      // Home Page
      home: {
        hero: {
          badge: "Isang circular economy para sa Siargao",
          title: "Ibalik ang pagkain sa ani ng isla.",
          subtitle: "Ang EcoLoop Siargao ay nagkokonekta sa mga magsasaka, restawran, residente at LGU kaya ang mga laba sa kusina ay nagiging compost, feed at sariwang produkto — pinapanatili ang isla na berde at ang loop na sarado.",
          joinLoop: "Sumali sa loop",
          seeHowItWorks: "Tingnan kung paano ito gumagana",
          wasteCollected: "Nakolektang basura",
          divertedFromLandfill: "Ibinaba mula sa landfill",
          activeMembers: "Aktibong miyembro"
        },
        problem: {
          label: "Ang problema",
          title: "Ang pagkain sa Siargao ay dapat sa lupa — hindi sa landfill.",
          description: "Tonelada ng nakakain na scraps at organic matter ang umaalis sa mga restawran, resort at bahay tuwing linggo. Samantala, ang mga lokal na magsasaka ay gumagastos sa mga input na maaari nilang magtalo mismo sa pamamagitan ng composting. Ang EcoLoop ay nagtulay sa dalawang dulo — at nagpapala sa lahat sa gitna.",
          point1: "Bawasan ang polusyon sa kapaligiran at methane mula sa mga landfill",
          point2: "Suportahan ang lokal na produksyon ng pagkain mula sa mababang compost",
          point3: "Palakasin ang kooperasyon sa barangay at kultura ng barter",
          point4: "Magplano nang maaga sa mga anunsyo ng future-supply at future-need"
        },
        roles: {
          title: "Ginawa para sa buong komunidad",
          subtitle: "Apat na papel, isang shared loop. Piliin kung paano mo gustong lumahok.",
          farmer: "Lokal na Magsasaka",
          farmerDesc: "I-post ang mga crops, ischedule ang mga ani, humiling ng pagkain para sa compost o feed.",
          restaurant: "Restawran",
          restaurantDesc: "Mag-alok ng pang-araw-araw na pagkain, i-promote ang mga menu item, barter ng mga meal para sa produce.",
          resident: "Residente",
          residentDesc: "I-drop ang mga household scraps, sumali sa barter trades, bumili ng lokal na produce.",
          lgu: "LGU Admins",
          lguDesc: "Bantayan ang diversion, i-verify ang mga user, ilathala ang mga anunsyo, mag-generate ng mga report."
        },
        features: {
          title: "Ang lahat ng kailangan ng loop",
          subtitle: "Mula sa pag-post ng scraps hanggang sa pag-track ng island-wide impact, ang EcoLoop ay nagbibigay ng bawat tool na kailangan ng komunidad sa isang lugar.",
          allFeatures: "Lahat ng tampok",
          ecoFeed: "EcoFeed",
          ecoFeedDesc: "Isang social feed ng available na crops, waste at trades mula sa iyong barangay.",
          marketplaces: "Marketplaces",
          marketplacesDesc: "Dalawang market — pagkain at sariwang produkto — na may mga litrato, timbang, presyo at lokasyon.",
          barter: "Barter & Trades",
          barterDesc: "I-swap ang waste, produce at mga meal nang walang cash. I-track ang bawat trade end-to-end.",
          smartSearch: "Smart Search",
          smartSearchDesc: "Hanapin ayon sa crop, user, barangay, restawran o waste type — agad.",
          maps: "Maps & Locations",
          mapsDesc: "Tingnan ang pickup points, malapit na farms at mga source ng pagkain sa isang tingin.",
          dashboard: "LGU Dashboard",
          dashboardDesc: "I-track ang nakolektang waste, na-divert, aktibong user at volume ng trade.",
          verified: "Verified Community",
          verifiedDesc: "Ang LGU-verified accounts ay nagpapanatili sa loop na ligtas at mapagkakatiwalaan."
        },
        cta: {
          title: "Handa na ba na sarado ang loop sa iyong block?",
          subtitle: "Magrehistro ng iyong farm, kusina o household at magsimula sa trading ngayon — walang cash, komunidad lang.",
          getStarted: "Magsimula",
          browseEcoFeed: "Browse ang EcoFeed"
        }
      },
      // About Page
      about: {
        hero: {
          eyebrow: "Tungkol sa",
          title: "Isang circular economy, dinisenyo para sa Siargao.",
          subtitle: "Ang EcoLoop Siargao ay isang platform ng komunidad na nagkokonekta sa mga taong gumagawa ng pagkain sa mga taong maaaring gawin itong kapaki-pakinabang — pagsasara ng loop sa sustainability ng isla."
        },
        mission: {
          title: "Ang aming misyon",
          description: "Ang ganda ng Siargao ay nakadepende sa nangyayari sa likod ng eksena — kung paano namamahala ang mga household ng scraps, kung paano hinahandle ng mga restawran ang trimmings, kung paano binubuhay ng mga magsasaka ang kanilang mga field, at kung paano nagpapangalaga ang mga LGU ng kolektibong resources. Ang EcoLoop ay nagpapadali at nagpapaganda ng bawat desisyon sa pamamagitan ng pagkokonekta sa isang circular system."
        },
        whyItMatters: {
          title: "Bakit ito mahalaga",
          description: "Ang pag-divert ng organic waste mula sa mga landfill ay nagbabawas ng methane emissions, naghihiwalay ng polusyon sa ating mga waterways, at lumilikha ng inputs para sa lokal na produksyon ng pagkain — pagpapalakas ng island food security at pagbaba ng gastos para sa mga magsasaka."
        },
        principles: {
          divert: "I-divert",
          divertDesc: "I-reroute ang organic waste palayo sa mga landfill.",
          regenerate: "I-regenerate",
          regenerateDesc: "Magtayo ng lupa at magtanim ng higit pang pagkain, lokal.",
          connect: "Konektahin",
          connectDesc: "Gawin ang komunidad ang platform.",
          sustain: "I-sustain",
          sustainDesc: "Protektahan ang Siargao para sa susunod na henerasyon."
        },
        loopSteps: {
          title: "Ang loop, sa simpleng salita",
          step1: "Ang mga restawran at bahay ay nag-post ng available na pagkain.",
          step2: "Ang mga magsasaka ay humihingi ng pickups para sa compost o animal feed.",
          step3: "Ang mga magsasaka ay nag-aalok ng mga ani bilang pagbebenta, trade, o barter.",
          step4: "Ang mga LGU ay nagbe-verify ng mga miyembro at nagta-track ng island-wide impact."
        }
      },
      // Features Page
      features: {
        hero: {
          eyebrow: "Mga Tampok",
          title: "Siyam na tool na pagsasara ng loop.",
          subtitle: "Ang EcoLoop ay nagbibigay ng social feed, dalawang marketplace, trade engine at LGU monitoring layer — lahat dinisenyo para sa buhay sa Siargao."
        },
        ecoFeed: "EcoFeed",
        ecoFeedDesc: "Isang dashboard ng komunidad ng crops, scraps at promotions mula sa mga magsasaka, residente at restawran — na may mga litrato, timbang, presyo, lokasyon at mga petsa.",
        userRegistration: "User Registration",
        userRegistrationDesc: "Sumali bilang Magsasaka, Restaurant Owner, o Residente. Ang mga LGU ay nagbe-verify ng mga account para panatilihin ang network na trusted.",
        richProfiles: "Rich Profiles",
        richProfilesDesc: "Mga profile na ayon sa papel: farm plot + crop calendar, restaurant hours + collection schedule, household waste availability.",
        foodWasteMarketplace: "Food Waste Marketplace",
        foodWasteMarketplaceDesc: "Mag-post ng available na waste na may quantity, pickup location, mga litrato at schedule. Ang mga magsasaka ay humihingi ng collection sa isang tap.",
        produceMarketplace: "Produce Marketplace",
        produceMarketplaceDesc: "Mga prutas, gulay, herbs at organic products na may mga litrato, timbang, presyo, available quantity at harvest date.",
        barterTrades: "Barter & Trades",
        barterTradesDesc: "Mga cashless trade request na may approval, status tracking at buong trade history.",
        smartSearch: "Smart Search",
        smartSearchDesc: "I-filter ayon sa crop, user, barangay, address, restawran o waste type.",
        mapsLocations: "Maps & Locations",
        mapsLocationsDesc: "Tingnan ang user locations, pickup points, malapit na food waste sources at malapit na farms.",
        lguDashboard: "LGU Admin Dashboard",
        lguDashboardDesc: "Bantayan ang nakolektang waste, diversion rates, aktibong user, successful trades at crop output — na may mga monthly report."
      },
      // How It Works Page
      howItWorks: {
        hero: {
          eyebrow: "Paano ito gumagana",
          title: "Isang apat na hakbang na loop na pwedeng gamitin ng buong isla.",
          subtitle: "Ang EcoLoop ay dinisenyo para maging natural tulad ng barangay tiangge — madaling sumali, mabilis gamitin, pantay para sa lahat."
        },
        steps: {
          post: "01 · I-post",
          postDesc: "Ibahagi ang mayroon ka o kailangan mo — pagkain, sariwang ani, o future supply.",
          match: "02 · I-match",
          matchDesc: "Browse ang EcoFeed o gamitin ang Smart Search para makahanap ng partner malapit.",
          exchange: "03 · Magpalitan",
          exchangeDesc: "I-coordinate ang pickup, barter o pagbebenta sa pamamagitan ng trade request flow.",
          track: "04 · I-track",
          trackDesc: "Ang bawat natapos na trade ay nai-roll up sa LGU dashboard bilang community impact."
        },
        example: {
          title: "Halimbawa: isang linggo sa loop",
          monday: "Lunes",
          mondayDesc: "Ang Kawayan Kitchen ay nag-post ng 20kg ng vegetable trimmings na available na pang-araw-araw pagkatapos ng lunch.",
          tuesday: "Martes",
          tuesdayDesc: "Ang Farm ni Mang Tonyo ay nagpadala ng trade request: 20kg scraps para sa 10kg ng sariwang kamatis.",
          friday: "Biyernes",
          fridayDesc: "Natapos ang trade. Na-update ang LGU dashboard: +20kg na na-divert, +1 na successful trade."
        },
        startPost: "Simulan ang iyong unang post"
      },
      // Auth Page
      auth: {
        hero: {
          eyebrow: "EcoLoop Account",
          title: "Mag-sign in o sumali sa loop.",
          subtitle: "Ang mga miyembro ay makapag-post sa EcoFeed, ilista ang waste at produce, humiling ng trades, at i-track ang community impact."
        },
        signIn: "Mag-sign in",
        createAccount: "Gumawa ng account",
        continueWithGoogle: "Magpatuloy sa Google",
        email: "Email",
        password: "Password",
        forgotPassword: "Nakalimutan ang password?",
        signingIn: "Nag-sign in…",
        fullName: "Buong pangalan",
        phone: "Telepono",
        barangay: "Barangay",
        barangayPlaceholder: "hal. General Luna",
        address: "Address (optional)",
        iAmA: "Ako ay isang…",
        farmer: "Magsasaka",
        restaurant: "Restawran",
        resident: "Residente",
        lguAdmin: "LGU Admin (nangangailangan ng approval)",
        creatingAccount: "Gumagawa ng account…",
        welcomeBack: "Welcome back!",
        accountCreated: "Nagawa ang account! Naka-sign in ka na.",
        lguAccountCreated: "Nagawa ang LGU account. Ang isang EcoLoop admin ay magsusuri at aprubahan ang access.",
        googleSignInFailed: "Nabigo ang Google sign-in",
        invalidInput: "Invalid input",
        unableToConfirmEmail: "Hindi ma-auto-confirm ang email"
      },
      // Contact Page
      contact: {
        hero: {
          eyebrow: "Contact",
          title: "Sarado natin ang loop together.",
          subtitle: "LGU partnerships, barangay rollouts, media o tanong lang — gusto naming marinig kayo."
        },
        email: "Email",
        phone: "Telepono",
        office: "Opisina",
        messageSent: "Nadala ang mensahe!",
        messageSentDesc: "Babalik kami sa inyo sa lalong madaling panahon. Salamat!",
        sendUsMessage: "Magpadala sa amin ng mensahe",
        name: "Pangalan",
        subject: "Paksa",
        message: "Mensahe",
        sendMessage: "Ipadala ang mensahe",
        demoForm: "Demo form — walang data na isinasubmit."
      },
      // Reset Password Page
      resetPassword: {
        setNewPassword: "Magtakda ng bagong password",
        resetYourPassword: "I-reset ang iyong password",
        newPassword: "Bagong password",
        updatePassword: "I-update ang password",
        email: "Email",
        sendResetLink: "Ipadala ang reset link",
        passwordUpdated: "Na-update ang password. Pwede ka nang mag-sign in.",
        checkInbox: "Suriin ang iyong inbox para sa reset link."
      },
      // Feed Page
      feed: {
        hero: {
          eyebrow: "EcoFeed",
          title: "Ano ang gumagalaw sa loop ngayon.",
          subtitle: "Browse ang mga pinakabagong post mula sa mga magsasaka, restawran at residente sa iyong barangay."
        },
        filters: {
          all: "Lahat",
          farmers: "Magsasaka",
          restaurants: "Restawran",
          residents: "Residente",
          lgu: "LGU"
        },
        postPlaceholder: "Ibahagi ang mga crops, waste o kailangan…",
        photo: "Litrato",
        location: "Lokasyon",
        post: "I-post",
        photoAttached: "✓ Litrato na nakalagay",
        locationAdded: "✓ Lokasyon na naidagdag",
        signInToPost: "Mag-sign in upang mag-post, mag-react at mag-trade.",
        signInToPostButton: "Mag-sign in upang mag-post",
        searchPlaceholder: "Maghanap sa feed",
        loadingFeed: "Naglo-load ng feed...",
        noPosts: "Walang post na tumutugma sa iyong filters pa.",
        whosPosting: "Sino ang nagpo-post",
        trending: "Trending sa Siargao",
        postPublished: "Na-post sa EcoFeed",
        unableToLoadFeed: "Hindi ma-load ang EcoFeed",
        sessionNotAvailable: "Ang iyong session ay hindi available o hindi tumutugma. Mangyaring mag-sign out at mag-sign in muli.",
        storageBucketNotFound: "Storage bucket hindi nahanap. Gumawa nito sa Supabase Storage o itakda ang VITE_SUPABASE_STORAGE_BUCKET.",
        storageUploadBlocked: "Hindi ma-upload ang litrato: storage upload na na-block ng row-level security. Siguraduhin na ang naka-sign in na user ay authenticated at ang Supabase storage bucket policy ay nagpapahintulot ng uploads.",
        couldNotUploadImage: "Hindi ma-upload ang litrato",
        publishBlocked: "Publish na na-block ng row-level security. Siguraduhin na naka-sign in ka at ang database RLS policies ay nagpapahintulot ng inserts para sa iyong user.",
        couldNotPublish: "Hindi ma-publish ang post"
      }
    }
  },
  ceb: {
    translation: {
      // Navigation
      nav: {
        home: "Balay",
        howItWorks: "Unsa managsa kini",
        features: "Mga Feature",
        about: "Mahitungod sa",
        signIn: "Mag-sign in",
        joinEcoLoop: "Sali sa EcoLoop",
        myProfile: "Akong profile",
        openApp: "Ablii ang app",
        myRequests: "Akong mga hangyo",
        signOut: "Mag-sign out",
        account: "Account"
      },
      // Profile
      profile: {
        myAccount: "Akong account",
        yourProfile: "Imong EcoLoop profile",
        userProfile: "Profile sa user",
        backToMyProfile: "Balik sa akong profile",
        fullName: "Bug-os nga ngalan",
        phone: "Telepono",
        barangay: "Barangay",
        address: "Address",
        saveChanges: "I-save ang mga pagbag-o",
        saving: "Nagsesave...",
        changePassword: "Usba ang Password",
        currentPassword: "Kasamtangan nga Password",
        newPassword: "Bag-ong Password",
        confirmPassword: "Sumbong ang Bag-ong Password",
        enterCurrentPassword: "Butang ang kasamtangan nga password",
        enterNewPassword: "Butang ang bag-ong password",
        confirmNewPassword: "Sumbong ang bag-ong password",
        updatePassword: "I-update ang Password",
        updating: "Nag-update...",
        message: "Mensahe",
        savePhoto: "I-save ang litrato",
        uploading: "Nag-upload...",
        profilePictureUpdated: "Na-update ang profile picture",
        fillAllPasswordFields: "Punan ang tanan nga password fields",
        passwordsDoNotMatch: "Dili angay ang mga bag-ong password",
        passwordMinLength: "Ang bag-ong password kinahanglan nga dili less sa 6 characters",
        passwordUpdated: "Malampuson nga na-update ang password",
        passwordUpdateFailed: "Nabigo ang pag-update sa password"
      },
      // General
      common: {
        selectLanguage: "Pilia ang Pinulongan",
        english: "English",
        tagalog: "Tagalog",
        cebuano: "Cebuano"
      },
      // Home Page
      home: {
        hero: {
          badge: "Usa ka circular economy alang sa Siargao",
          title: "Ibalik ang pagkaon sa ani sa isla.",
          subtitle: "Ang EcoLoop Siargao nagkonekta sa mga mag-uuma, restawran, residente ug LGU busa ang mga laba sa kusina mahimong compost, feed ug bag-ong produkto — nagpabilin sa isla nga berde ug ang loop nga sarado.",
          joinLoop: "Sali sa loop",
          seeHowItWorks: "Tan-awa kung unsa managsa kini",
          wasteCollected: "Nakolekta nga basura",
          divertedFromLandfill: "Ibaba gikan sa landfill",
          activeMembers: "Aktibong miyembro"
        },
        problem: {
          label: "Ang problema",
          title: "Ang pagkaon sa Siargao kinahanglan sa yuta — dili sa landfill.",
          description: "Tonelada sa makakaon nga scraps ug organic matter ang mobalik sa mga restawran, resort ug balay matag semana. Samtanan, ang mga lokal nga mag-uuma naggastos sa mga input nga mahimo nilang magtalo mismo pinaagi sa composting. Ang EcoLoop nagtulay sa duha nga tumoy — ug nagpahalag sa tanan sa tunga-tunga.",
          point1: "Bawasan ang polusyon sa kapalibutan ug methane gikan sa mga landfill",
          point2: "Suportahan ang lokal nga produksyon sa pagkaon gikan sa mubong compost",
          point3: "Palig-on ang kooperasyon sa barangay ug kultura sa barter",
          point4: "Magplano nang sayo sa mga anunsyo sa future-supply ug future-need"
        },
        roles: {
          title: "Gihimo alang sa tibuok komunidad",
          subtitle: "Upat nga papel, usa ka shared loop. Pilia kung unsa gusto nimo moapil.",
          farmer: "Lokal nga Mag-uuma",
          farmerDesc: "I-post ang mga crops, ischedule ang mga ani, mangayo og pagkaon alang sa compost o feed.",
          restaurant: "Restawran",
          restaurantDesc: "Mag-alok sa adlaw-adlaw nga pagkaon, i-promote ang mga menu item, barter sa mga meal alang sa produce.",
          resident: "Residente",
          residentDesc: "I-drop ang mga household scraps, sali sa barter trades, palit og lokal nga produce.",
          lgu: "LGU Admins",
          lguDesc: "Bantayan ang diversion, i-verify ang mga user, ilimbag ang mga anunsyo, mag-generate sa mga report."
        },
        features: {
          title: "Ang tanan nga gikinahanglan sa loop",
          subtitle: "Gikan sa pag-post sa scraps hangtod sa pag-track sa island-wide impact, ang EcoLoop naghatag sa matag tool nga gikinahanglan sa komunidad sa usa ka lugar.",
          allFeatures: "Tanang feature",
          ecoFeed: "EcoFeed",
          ecoFeedDesc: "Usa ka social feed sa available nga crops, waste ug trades gikan sa imong barangay.",
          marketplaces: "Marketplaces",
          marketplacesDesc: "Duha ka market — pagkaon ug bag-ong produkto — nga may mga litrato, timbang, presyo ug lokasyon.",
          barter: "Barter & Trades",
          barterDesc: "I-swap ang waste, produce ug mga meal nga walay cash. I-track ang matag trade end-to-end.",
          smartSearch: "Smart Search",
          smartSearchDesc: "Pangitaon sumala sa crop, user, barangay, restawran o waste type — dayon.",
          maps: "Maps & Locations",
          mapsDesc: "Tan-awa ang pickup points, duol nga farms ug mga source sa pagkaon sa usa ka tingin.",
          dashboard: "LGU Dashboard",
          dashboardDesc: "I-track ang nakolekta nga waste, na-divert, aktibong user ug volume sa trade.",
          verified: "Verified Community",
          verifiedDesc: "Ang LGU-verified accounts nagpabilin sa loop nga luwas ug mapagpahalag."
        },
        cta: {
          title: "Andam na ba nga sarado ang loop sa imong block?",
          subtitle: "Magrehistro sa imong farm, kusina o household ug magsugod sa trading karun — walay cash, komunidad lang.",
          getStarted: "Magsugod",
          browseEcoFeed: "Browse ang EcoFeed"
        }
      },
      // About Page
      about: {
        hero: {
          eyebrow: "Mahitungod sa",
          title: "Usa ka circular economy, gidesinyo alang sa Siargao.",
          subtitle: "Ang EcoLoop Siargao usa ka platform sa komunidad nga nagkonekta sa mga tawo nga nagbuhat sa pagkaon sa mga tawo nga mahimo kini nga kapinabahan — pagsarado sa loop sa sustainability sa isla."
        },
        mission: {
          title: "Ang among misyon",
          description: "Ang ganda sa Siargao nagdepende sa nangyari sa likod sa eksena — kung unsa managemaher ang mga household sa scraps, kung unsa manehandle ang mga restawran ang trimmings, kung unsa binuhay ang mga mag-uuma ang ilang mga field, ug kung unsa nagpangalaga ang mga LGU sa kolektibong resources. Ang EcoLoop nagpadali ug nagpahimutang sa matag desisyon pinaagi sa pagkonekta sa usa ka circular system."
        },
        whyItMatters: {
          title: "Ngano kini importante",
          description: "Ang pag-divert sa organic waste gikan sa mga landfill nagbawas sa methane emissions, naghiwalay sa polusyon sa atong mga waterways, ug naghimo og inputs alang sa lokal nga produksyon sa pagkaon — pagpalig-on sa island food security ug pagbaba sa gastos alang sa mga mag-uuma."
        },
        principles: {
          divert: "I-divert",
          divertDesc: "I-reroute ang organic waste gawas sa mga landfill.",
          regenerate: "I-regenerate",
          regenerateDesc: "Magtayo sa yuta ug magtanim og daghan pa nga pagkaon, lokal.",
          connect: "Konektaha",
          connectDesc: "Himoa ang komunidad ang platform.",
          sustain: "I-sustain",
          sustainDesc: "Protektahan ang Siargao alang sa sunod nga henerasyon."
        },
        loopSteps: {
          title: "Ang loop, sa yano nga pulong",
          step1: "Ang mga restawran ug balay nag-post sa available nga pagkaon.",
          step2: "Ang mga mag-uuma mangayo og pickups alang sa compost o animal feed.",
          step3: "Ang mga mag-uuma nag-alok sa mga ani ingon pagbaligya, trade, o barter.",
          step4: "Ang mga LGU nag-verify sa mga miyembro ug nag-track sa island-wide impact."
        }
      },
      // Features Page
      features: {
        hero: {
          eyebrow: "Mga Feature",
          title: "Siyam nga tool nga pagsarado sa loop.",
          subtitle: "Ang EcoLoop naghatag og social feed, duha ka marketplace, trade engine ug LGU monitoring layer — tanang gidesinyo alang sa kinabuhi sa Siargao."
        },
        ecoFeed: "EcoFeed",
        ecoFeedDesc: "Usa ka dashboard sa komunidad sa crops, scraps ug promotions gikan sa mga mag-uuma, residente ug restawran — nga may mga litrato, timbang, presyo, lokasyon ug mga petsa.",
        userRegistration: "User Registration",
        userRegistrationDesc: "Sali ingon Mag-uuma, Restaurant Owner, o Residente. Ang mga LGU nag-verify sa mga account aron panalipdan ang network nga trusted.",
        richProfiles: "Rich Profiles",
        richProfilesDesc: "Mga profile nga sumala sa papel: farm plot + crop calendar, restaurant hours + collection schedule, household waste availability.",
        foodWasteMarketplace: "Food Waste Marketplace",
        foodWasteMarketplaceDesc: "I-post sa available nga waste nga may quantity, pickup location, mga litrato ug schedule. Ang mga mag-uuma mangayo og collection sa usa ka tap.",
        produceMarketplace: "Produce Marketplace",
        produceMarketplaceDesc: "Mga prutas, gulay, herbs ug organic products nga may mga litrato, timbang, presyo, available quantity ug harvest date.",
        barterTrades: "Barter & Trades",
        barterTradesDesc: "Mga cashless trade request nga may approval, status tracking ug tibuok trade history.",
        smartSearch: "Smart Search",
        smartSearchDesc: "I-filter sumala sa crop, user, barangay, address, restawran o waste type.",
        mapsLocations: "Maps & Locations",
        mapsLocationsDesc: "Tan-awa ang user locations, pickup points, duol nga food waste sources ug duol nga farms.",
        lguDashboard: "LGU Admin Dashboard",
        lguDashboardDesc: "Bantayan ang nakolekta nga waste, diversion rates, aktibong user, successful trades ug crop output — nga may mga monthly report."
      },
      // How It Works Page
      howItWorks: {
        hero: {
          eyebrow: "Unsa managsa kini",
          title: "Upat nga lakang nga loop nga mahimong gamiton sa tibuok isla.",
          subtitle: "Ang EcoLoop gidesinyo aron natural nga ingon sa barangay tiangge — sayon nga moapil, dali gamiton, patay sa tanan."
        },
        steps: {
          post: "01 · I-post",
          postDesc: "Ibahagi ang naa nimo o kinahanglan nimo — pagkaon, bag-ong ani, o future supply.",
          match: "02 · I-match",
          matchDesc: "Browse ang EcoFeed o gamit ang Smart Search aron makapangita og partner duol.",
          exchange: "03 · Magpalitan",
          exchangeDesc: "I-coordinate ang pickup, barter o pagbaligya pinaagi sa trade request flow.",
          track: "04 · I-track",
          trackDesc: "Ang matag humanong trade nai-roll up sa LGU dashboard isip community impact."
        },
        example: {
          title: "Tig-alihan: usa ka semana sa loop",
          monday: "Lunes",
          mondayDesc: "Ang Kawayan Kitchen nag-post og 20kg sa vegetable trimmings nga available matag adlaw humanap sa lunch.",
          tuesday: "Martes",
          tuesdayDesc: "Ang Farm ni Mang Tonyo nagpadala og trade request: 20kg scraps para sa 10kg sa bag-ong kamatis.",
          friday: "Biyernes",
          fridayDesc: "Humanon ang trade. Na-update ang LGU dashboard: +20kg na na-divert, +1 nga successful trade."
        },
        startPost: "Magsugod sa imong una nga post"
      },
      // Auth Page
      auth: {
        hero: {
          eyebrow: "EcoLoop Account",
          title: "Mag-sign in o sali sa loop.",
          subtitle: "Ang mga miyembro makapag-post sa EcoFeed, ilista ang waste ug produce, mangayo og trades, ug i-track ang community impact."
        },
        signIn: "Mag-sign in",
        createAccount: "Paghimo og account",
        continueWithGoogle: "Magpadayon sa Google",
        email: "Email",
        password: "Password",
        forgotPassword: "Nakalimtan ang password?",
        signingIn: "Nag-sign in…",
        fullName: "Bug-os nga ngalan",
        phone: "Telepono",
        barangay: "Barangay",
        barangayPlaceholder: "hal. General Luna",
        address: "Address (optional)",
        iAmA: "Ako usa ka…",
        farmer: "Mag-uuma",
        restaurant: "Restawran",
        resident: "Residente",
        lguAdmin: "LGU Admin (nanginahalo og approval)",
        creatingAccount: "Naghimo og account…",
        welcomeBack: "Welcome back!",
        accountCreated: "Nahimo ang account! Naka-sign in ka na.",
        lguAccountCreated: "Nahimo ang LGU account. Ang usa ka EcoLoop admin mosuri ug aprubahan ang access.",
        googleSignInFailed: "Nabigo ang Google sign-in",
        invalidInput: "Invalid input",
        unableToConfirmEmail: "Dili ma-auto-confirm ang email"
      },
      // Contact Page
      contact: {
        hero: {
          eyebrow: "Contact",
          title: "Sarado nato ang loop together.",
          subtitle: "LGU partnerships, barangay rollouts, media o tanag lang — gusto namo madungog ninyo."
        },
        email: "Email",
        phone: "Telepono",
        office: "Opisina",
        messageSent: "Nadala ang mensahe!",
        messageSentDesc: "Mobalik kami ninyo sa lalong madaling panahon. Salamat!",
        sendUsMessage: "Magpadala sa amon mensahe",
        name: "Ngalan",
        subject: "Paksa",
        message: "Mensahe",
        sendMessage: "Ipadala ang mensahe",
        demoForm: "Demo form — walay data nga isinasubmit."
      },
      // Reset Password Page
      resetPassword: {
        setNewPassword: "Magtakda og bag-ong password",
        resetYourPassword: "I-reset ang imong password",
        newPassword: "Bag-ong password",
        updatePassword: "I-update ang password",
        email: "Email",
        sendResetLink: "Ipadala ang reset link",
        passwordUpdated: "Na-update ang password. Pwede ka na mag-sign in.",
        checkInbox: "Suriin ang imong inbox para sa reset link."
      },
      // Feed Page
      feed: {
        hero: {
          eyebrow: "EcoFeed",
          title: "Unsa ang nagbalhin sa loop karun.",
          subtitle: "Browse ang mga pinakabag-ong post gikan sa mga mag-uuma, restawran ug residente sa imong barangay."
        },
        filters: {
          all: "Tanang",
          farmers: "Mag-uuma",
          restaurants: "Restawran",
          residents: "Residente",
          lgu: "LGU"
        },
        postPlaceholder: "Ibahagi ang mga crops, waste o kinahanglan…",
        photo: "Litrato",
        location: "Lokasyon",
        post: "I-post",
        photoAttached: "✓ Litrato na nakalagay",
        locationAdded: "✓ Lokasyon na naidagdag",
        signInToPost: "Mag-sign in aron mag-post, mag-react ug mag-trade.",
        signInToPostButton: "Mag-sign in aron mag-post",
        searchPlaceholder: "Pangitaon sa feed",
        loadingFeed: "Naglo-load sa feed...",
        noPosts: "Walay post nga tumugma sa imong filters pa.",
        whosPosting: "Kinsa ang nagpo-post",
        trending: "Trending sa Siargao",
        postPublished: "Na-post sa EcoFeed",
        unableToLoadFeed: "Dili ma-load ang EcoFeed",
        sessionNotAvailable: "Ang imong session dili available o dili tumugma. Palihug mag-sign out ug mag-sign in balik.",
        storageBucketNotFound: "Storage bucket wala makita. Paghimo niini sa Supabase Storage o itakda ang VITE_SUPABASE_STORAGE_BUCKET.",
        storageUploadBlocked: "Dili ma-upload ang litrato: storage upload nga na-block sa row-level security. Siguraduhon nga ang naka-sign in nga user authenticated ug ang Supabase storage bucket policy nagtugot og uploads.",
        couldNotUploadImage: "Dili ma-upload ang litrato",
        publishBlocked: "Publish nga na-block sa row-level security. Siguraduhon nga naka-sign in ka ug ang database RLS policies nagtugot og inserts para sa imong user.",
        couldNotPublish: "Dili ma-publish ang post"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: typeof window !== 'undefined' ? (localStorage.getItem('selectedLanguage') || 'en') : 'en',
    detection: {
      order: typeof window !== 'undefined' ? ['localStorage', 'navigator'] : ['navigator'],
      caches: typeof window !== 'undefined' ? ['localStorage'] : [],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
