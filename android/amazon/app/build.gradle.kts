plugins { id("com.android.application") }

android {
    namespace = "de.nadena.orvuno"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.nadena.orvuno"
        minSdk = 23
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1-amazon"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("com.amazon.device:amazon-appstore-sdk:3.0.9")
}
