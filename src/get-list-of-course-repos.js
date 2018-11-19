// npx babel-node src/get-list-of-course-repos

import * as fs from 'fs-extra';
import * as jsyaml from 'js-yaml';
import { logger } from './utils/logger';

async function getListOfCourseRepos() {
  const yamlFile = 'all-courses.yml';

  const octokit = require('@octokit/rest')();

  let courses = [];

  try {
    let morePagesToProcess = true;
    let pageNum = 1;
    let repoNum = 1;
    while (morePagesToProcess) {
      const result = await octokit.repos.getForOrg({
        org: 'exlskills',
        type: 'public',
        per_page: 100,
        page: pageNum
      });
      //logger.debug(JSON.stringify(result));
      if (!result || !result.data) {
        break;
      }
      for (let repo of result.data) {
        logger.debug(JSON.stringify(repoNum + ` ` + repo.name));
        repoNum++;
        if (
          (repo.name.startsWith('course-') ||
            repo.name.startsWith('micro-course-')) &&
          !repo.name.startsWith('course-template') &&
          !repo.name.startsWith('course-schedules')
        ) {
          logger.debug(JSON.stringify(`   course ` + repo.name));
          courses.push({ repo: repo.clone_url, folder: repo.name });
        }
      }
      if (octokit.hasNextPage(result)) {
        pageNum++;
      } else {
        break;
      }
    }

    if (courses.length > 0) {
      const yamlObj = { courses_to_load: courses };
      const yaml_out = jsyaml.safeDump(yamlObj);
      logger.debug(` jaml_out ` + yaml_out);
      if (yamlFile) {
        await fs.remove(yamlFile);
        await fs.writeFile(yamlFile, yaml_out);
        logger.info(`List of courses has been written into ` + yamlFile);
      }
    } else {
      logger.info(`No courses found`);
    }
  } catch (err) {
    logger.error('error ' + err);
  }
}

startRun();

async function startRun() {
  try {
    const res = await getListOfCourseRepos();
    logger.info('done');
  } catch (err) {
    // Must be reported in loadData
  }
}
