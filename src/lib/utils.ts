import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Volunteer, Task } from '../types';

/** Standard Tailwind merge utility for clean component classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the great-circle distance between two points on a sphere given their longitudes and latitudes.
 * @returns Distance in kilometers
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

/**
 * AI Task Matching Engine Utility.
 * Scores and sorts an array of tasks against a specific volunteer's profile based on
 * skill matching (70% weight) and location proximity (30% weight).
 * 
 * @param volunteer The volunteer we are trying to dispatch
 * @param tasks The list of all open tasks
 * @returns An array of tasks sorted with the highest `matchScore` first
 */
export function matchTasksToVolunteer(volunteer: Volunteer, tasks: Task[]): Task[] {
  // Combine skills and equipment into a single lowercase set for easy matching
  const volunteerCapabilities = new Set(
    [...volunteer.skills, ...volunteer.equipment].map(s => s.toLowerCase().trim())
  );

  const scoredTasks = tasks.map(task => {
    // 1. Calculate Skill Score (0 to 100)
    let skillScore = 0;
    if (task.requiredSkills && task.requiredSkills.length > 0) {
      const matchedSkills = task.requiredSkills.filter(reqSkill => 
        volunteerCapabilities.has(reqSkill.toLowerCase().trim())
      );
      skillScore = (matchedSkills.length / task.requiredSkills.length) * 100;
    } else {
      skillScore = 100; // If task requires no specific skills, it's a 100% skill match
    }

    // 2. Calculate Location Score (0 to 100)
    let finalScore = skillScore; // Default to purely skill-based
    
    // If both the volunteer and the task have physical coordinates, apply proximity logic
    if (volunteer.location?.lat && task.location?.lat) {
      const distanceKm = getHaversineDistance(
        volunteer.location.lat, 
        volunteer.location.lng, 
        task.location.lat, 
        task.location.lng
      );
      
      // Proximity scoring: 
      // 0km away = 100 points. Scales down to 0 points if > 50km away.
      const proximityScore = Math.max(0, 100 - (distanceKm / 50) * 100);
      
      // Weighted final score: 70% based on having the right gear/skills, 30% based on distance
      finalScore = (skillScore * 0.7) + (proximityScore * 0.3);
    }

    // Attach the calculated score to the task
    return {
      ...task,
      matchScore: Math.round(finalScore)
    };
  });

  // Sort descending so the best match is index 0
  return scoredTasks.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}