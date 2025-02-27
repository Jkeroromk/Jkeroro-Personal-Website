import LinkforBio from "@/components/linkforbio";
import Tabs from "@/components/tabs";
import Stack from "@/components/stack";
import MusicPlayer from "@/components/musicPlayer";
import Footer from "@/components/footer";
import Album from "@/components/album";
import Interact from "@/components/interact";
import MouseTrail from "@/components/mousetrail";
import PersonalStore from "@/components/personalStore";

import { AuthProvider } from "../auth";

export default function Home() {

  return (
    <>
      <main>
        <AuthProvider>
        <MouseTrail/>
        <Interact/>
        <LinkforBio/>
        <Stack/>
        <MusicPlayer />
        <Tabs />
        <PersonalStore/>
        <Album />
        <Footer />
        </AuthProvider>
      </main> 
    </>
  );
}
