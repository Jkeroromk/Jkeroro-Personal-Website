'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Eye } from 'lucide-react'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { database, ref, onValue, incrementViewCount, trackVisitorLocation } from '../../firebase'
import WorldMapDialog from '@/components/effects/worldMap'

const ViewerStats = () => {
  const [viewerCount, setViewerCount] = useState(0)
  const [viewerError, setViewerError] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

  // Viewer count and location tracking
  useEffect(() => {
    trackVisitorLocation().catch((err) => {
      console.error("Error tracking visitor location:", err);
    });
    incrementViewCount().catch((err) => {
      console.error("Error incrementing view count:", err);
    });

    const viewerCountRef = ref(database, "viewCount");
    const unsubscribe = onValue(
      viewerCountRef,
      (snapshot) => {
        setViewerCount(snapshot.val()?.count || 0);
        setViewerError(null);
      },
      (error) => {
        console.error("Error fetching viewer count:", error.code, error.message);
        setViewerError(error.code === "PERMISSION_DENIED" ? "Permission denied" : "Error loading viewers");
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AlertDialog open={mapOpen} onOpenChange={setMapOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-black">
          <Eye /> {viewerError ? "N/A" : viewerCount} Viewers
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-lg scale-[0.9] sm:scale-[1]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">Audience Map</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            View the geographic distribution of your audience across the world.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <WorldMapDialog />
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-black text-white hover:bg-red-400">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ViewerStats
