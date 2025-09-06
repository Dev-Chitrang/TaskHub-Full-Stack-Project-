'use client'

import NoDataFound from '@/app/(protected)/workspaces/NoDataFound'
import React from 'react'
import ProjectCard from './project/ProjectCard'
import { getProjectProgress } from '@/lib'

const ProjectList = ({
    workspaceId,
    projects,
    onCreateProject
}) => {
    return (
        <div>
            <h3 className='text-xl font-medium mb-4'>
                Projects
            </h3>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {
                    projects.length === 0 ? <NoDataFound title={"No Projects found"} description={"You have no projects yet. Create a project to get started."} buttonText={"Create Project"} buttonAction={onCreateProject} /> : (projects.map((project) => {
                        const projectProgress = getProjectProgress(project.tasks)
                        return (<ProjectCard key={project.id} project={project} progress={projectProgress} workspaceId={workspaceId} />)
                    }))
                }
            </div>
        </div>
    )
}

export default ProjectList