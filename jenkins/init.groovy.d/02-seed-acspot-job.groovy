import hudson.plugins.git.BranchSpec
import hudson.plugins.git.GitSCM
import hudson.triggers.SCMTrigger
import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import org.jenkinsci.plugins.workflow.job.WorkflowJob

def instance = Jenkins.get()
def jobName = 'acspot-deploy'
def repoUrl = System.getenv('ACSPOT_REPOSITORY_URL') ?: 'https://github.com/Ojeonghwan/acspot.git'

def job = instance.getItem(jobName)
if (job == null) {
  job = instance.createProject(WorkflowJob, jobName)
}

def scm = new GitSCM(repoUrl)
scm.branches = [new BranchSpec('*/main')]
def definition = new CpsScmFlowDefinition(scm, 'Jenkinsfile')
definition.lightweight = true
job.setDefinition(definition)
job.addTrigger(new SCMTrigger('H/2 * * * *'))
job.save()
